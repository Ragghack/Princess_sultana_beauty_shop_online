// src/controllers/analyticsController.js
const prisma = require("../config/database");
const asyncHandler = require("../utils/asyncHandler");
const ApiResponse = require("../utils/ApiResponse");
const ApiError = require("../utils/ApiError");

class AnalyticsController {
  /**
   * @route   GET /api/v1/analytics/dashboard
   * @desc    Get dashboard overview analytics
   * @access  Private (Admin/Staff)
   */
  getDashboardAnalytics = asyncHandler(async (req, res) => {
    const { startDate, endDate } = req.query;
    
    const whereCondition = {};
    
    if (startDate && endDate) {
      whereCondition.createdAt = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    // Get counts
    const [
      totalOrders,
      totalRevenue,
      totalCustomers,
      totalProducts,
      recentOrders,
      topProducts,
    ] = await Promise.all([
      // Total orders
      prisma.order.count({
        where: whereCondition,
      }),
      
      // Total revenue (sum of order totals)
      prisma.order.aggregate({
        where: whereCondition,
        _sum: {
          total: true,
        },
      }),
      
      // Total customers
      prisma.user.count({
        where: {
          ...whereCondition,
          role: "CUSTOMER",
        },
      }),
      
      // Total products
      prisma.product.count({
        where: {
          deletedAt: null,
        },
      }),
      
      // Recent orders
      prisma.order.findMany({
        where: whereCondition,
        take: 5,
        orderBy: { createdAt: "desc" },
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      }),
      
      // Top selling products
      prisma.product.findMany({
        where: {
          deletedAt: null,
        },
        take: 5,
        orderBy: { salesCount: "desc" },
        include: {
          images: {
            take: 1,
          },
        },
      }),
    ]);

    // Calculate revenue growth (compared to previous period)
    let revenueGrowth = 0;
    if (startDate && endDate) {
      const prevStartDate = new Date(startDate);
      const prevEndDate = new Date(endDate);
      const periodDiff = prevEndDate - prevStartDate;
      
      prevStartDate.setTime(prevStartDate.getTime() - periodDiff);
      prevEndDate.setTime(prevEndDate.getTime() - periodDiff);
      
      const previousRevenue = await prisma.order.aggregate({
        where: {
          createdAt: {
            gte: prevStartDate,
            lte: prevEndDate,
          },
        },
        _sum: {
          total: true,
        },
      });
      
      const currentRevenue = totalRevenue._sum.total || 0;
      const prevRevenue = previousRevenue._sum.total || 0;
      
      if (prevRevenue > 0) {
        revenueGrowth = ((currentRevenue - prevRevenue) / prevRevenue) * 100;
      }
    }

    res.status(200).json(
      new ApiResponse(200, {
        overview: {
          totalOrders,
          totalRevenue: totalRevenue._sum.total || 0,
          totalCustomers,
          totalProducts,
          revenueGrowth: parseFloat(revenueGrowth.toFixed(2)),
        },
        recentOrders,
        topProducts,
      })
    );
  });

  /**
   * @route   GET /api/v1/analytics/sales
   * @desc    Get sales analytics with time series
   * @access  Private (Admin/Staff)
   */
  getSalesAnalytics = asyncHandler(async (req, res) => {
    const { period = "monthly", startDate, endDate } = req.query;
    
    let dateFormat;
    switch (period) {
      case "daily":
        dateFormat = "%Y-%m-%d";
        break;
      case "weekly":
        dateFormat = "%Y-%u";
        break;
      case "monthly":
      default:
        dateFormat = "%Y-%m";
        break;
      case "yearly":
        dateFormat = "%Y";
        break;
    }

    // For MongoDB, we need to use aggregation pipeline
    const salesData = await prisma.order.groupBy({
      by: ['createdAt'],
      where: {
        ...(startDate && endDate && {
          createdAt: {
            gte: new Date(startDate),
            lte: new Date(endDate),
          },
        }),
      },
      _sum: {
        total: true,
      },
      _count: {
        id: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    // Format data for chart
    const formattedData = salesData.map(item => ({
      date: item.createdAt,
      revenue: item._sum.total || 0,
      orders: item._count.id,
    }));

    // Calculate totals
    const totalRevenue = formattedData.reduce((sum, item) => sum + item.revenue, 0);
    const totalOrders = formattedData.reduce((sum, item) => sum + item.orders, 0);

    res.status(200).json(
      new ApiResponse(200, {
        period,
        totalRevenue,
        totalOrders,
        averageOrderValue: totalOrders > 0 ? totalRevenue / totalOrders : 0,
        data: formattedData,
      })
    );
  });

  /**
   * @route   GET /api/v1/analytics/products
   * @desc    Get product analytics
   * @access  Private (Admin/Staff)
   */
  getProductAnalytics = asyncHandler(async (req, res) => {
    const { limit = 10, sortBy = "sales", order = "desc" } = req.query;

    const products = await prisma.product.findMany({
      where: {
        deletedAt: null,
      },
      take: parseInt(limit),
      orderBy: {
        [sortBy]: order,
      },
      include: {
        images: {
          take: 1,
        },
        reviews: {
          select: {
            rating: true,
          },
        },
      },
    });

    // Calculate additional metrics
    const productsWithMetrics = products.map((product) => {
      const ratings = product.reviews.map((r) => r.rating);
      const avgRating = ratings.length > 0
        ? ratings.reduce((a, b) => a + b, 0) / ratings.length
        : 0;

      const stockStatus = product.stockQuantity === 0
        ? "OUT_OF_STOCK"
        : product.stockQuantity <= product.lowStockThreshold
        ? "LOW_STOCK"
        : "IN_STOCK";

      return {
        ...product,
        avgRating: parseFloat(avgRating.toFixed(1)),
        reviewCount: ratings.length,
        stockStatus,
        conversionRate: product.viewCount > 0
          ? (product.salesCount / product.viewCount) * 100
          : 0,
        reviews: undefined, // Remove reviews array
      };
    });

    // Get stock summary
    const stockSummary = {
      total: products.length,
      inStock: products.filter(p => p.stockQuantity > 0).length,
      lowStock: products.filter(p => p.stockQuantity > 0 && p.stockQuantity <= p.lowStockThreshold).length,
      outOfStock: products.filter(p => p.stockQuantity === 0).length,
    };

    res.status(200).json(
      new ApiResponse(200, {
        products: productsWithMetrics,
        stockSummary,
        topCategories: await this.getTopCategories(),
      })
    );
  });

  /**
   * @route   GET /api/v1/analytics/customers
   * @desc    Get customer analytics
   * @access  Private (Admin/Staff)
   */
  getCustomerAnalytics = asyncHandler(async (req, res) => {
    const { startDate, endDate } = req.query;
    
    const whereCondition = {};
    
    if (startDate && endDate) {
      whereCondition.createdAt = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    const [
      totalCustomers,
      newCustomers,
      topCustomers,
      customerGrowth,
    ] = await Promise.all([
      // Total customers
      prisma.user.count({
        where: {
          ...whereCondition,
          role: "CUSTOMER",
        },
      }),
      
      // New customers (last 30 days)
      prisma.user.count({
        where: {
          role: "CUSTOMER",
          createdAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          },
        },
      }),
      
      // Top customers by order value
      prisma.user.findMany({
        where: {
          role: "CUSTOMER",
        },
        take: 10,
        include: {
          orders: {
            select: {
              total: true,
            },
          },
        },
      }).then(users => 
        users.map(user => ({
          ...user,
          totalSpent: user.orders.reduce((sum, order) => sum + (order.total || 0), 0),
          orderCount: user.orders.length,
          orders: undefined, // Remove orders array
        }))
        .sort((a, b) => b.totalSpent - a.totalSpent)
      ),
      
      // Customer growth over time
      this.getCustomerGrowthData(startDate, endDate),
    ]);

    res.status(200).json(
      new ApiResponse(200, {
        overview: {
          totalCustomers,
          newCustomers,
          averageOrderValue: await this.getAverageOrderValue(),
          repeatPurchaseRate: await this.getRepeatPurchaseRate(),
        },
        topCustomers,
        growthData: customerGrowth,
      })
    );
  });

  /**
   * @route   GET /api/v1/analytics/revenue
   * @desc    Get revenue analytics
   * @access  Private (Admin/Staff)
   */
  getRevenueAnalytics = asyncHandler(async (req, res) => {
    const { startDate, endDate } = req.query;
    
    const whereCondition = {};
    
    if (startDate && endDate) {
      whereCondition.createdAt = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    const [
      revenueData,
      revenueByCategory,
      paymentMethods,
    ] = await Promise.all([
      // Revenue over time
      prisma.order.groupBy({
        by: ['createdAt'],
        where: whereCondition,
        _sum: {
          total: true,
        },
        orderBy: {
          createdAt: 'asc',
        },
      }),
      
      // Revenue by product category
      this.getRevenueByCategory(startDate, endDate),
      
      // Payment method distribution
      prisma.order.groupBy({
        by: ['paymentMethod'],
        where: whereCondition,
        _sum: {
          total: true,
        },
        _count: {
          id: true,
        },
      }),
    ]);

    const formattedRevenueData = revenueData.map(item => ({
      date: item.createdAt,
      revenue: item._sum.total || 0,
    }));

    const totalRevenue = formattedRevenueData.reduce((sum, item) => sum + item.revenue, 0);

    res.status(200).json(
      new ApiResponse(200, {
        totalRevenue,
        revenueOverTime: formattedRevenueData,
        revenueByCategory,
        paymentMethods: paymentMethods.map(pm => ({
          method: pm.paymentMethod,
          revenue: pm._sum.total || 0,
          count: pm._count.id,
          percentage: totalRevenue > 0 ? ((pm._sum.total || 0) / totalRevenue) * 100 : 0,
        })),
        metrics: {
          averageOrderValue: await this.getAverageOrderValue(whereCondition),
          revenueGrowth: await this.getRevenueGrowth(startDate, endDate),
        },
      })
    );
  });

  // Helper methods
  async getTopCategories() {
    const categories = await prisma.product.groupBy({
      by: ['category'],
      where: {
        deletedAt: null,
      },
      _count: {
        id: true,
      },
      _sum: {
        salesCount: true,
      },
      orderBy: {
        _sum: {
          salesCount: 'desc',
        },
      },
      take: 5,
    });

    return categories.map(cat => ({
      category: cat.category,
      productCount: cat._count.id,
      totalSales: cat._sum.salesCount || 0,
    }));
  }

  async getCustomerGrowthData(startDate, endDate) {
    // Simplified - in production, you'd want proper time series data
    const currentPeriod = await prisma.user.count({
      where: {
        role: "CUSTOMER",
        ...(startDate && endDate && {
          createdAt: {
            gte: new Date(startDate),
            lte: new Date(endDate),
          },
        }),
      },
    });

    const previousPeriod = startDate && endDate
      ? await prisma.user.count({
          where: {
            role: "CUSTOMER",
            createdAt: {
              gte: new Date(new Date(startDate).getTime() - (30 * 24 * 60 * 60 * 1000)),
              lte: new Date(new Date(endDate).getTime() - (30 * 24 * 60 * 60 * 1000)),
            },
          },
        })
      : 0;

    return {
      currentPeriod,
      previousPeriod,
      growth: previousPeriod > 0 ? ((currentPeriod - previousPeriod) / previousPeriod) * 100 : 100,
    };
  }

  async getAverageOrderValue(whereCondition = {}) {
    const result = await prisma.order.aggregate({
      where: whereCondition,
      _avg: {
        total: true,
      },
    });

    return result._avg.total || 0;
  }

  async getRepeatPurchaseRate() {
    const totalCustomers = await prisma.user.count({
      where: { role: "CUSTOMER" },
    });

    const repeatCustomers = await prisma.user.count({
      where: {
        role: "CUSTOMER",
        orders: {
          some: {},
        },
      },
    });

    return totalCustomers > 0 ? (repeatCustomers / totalCustomers) * 100 : 0;
  }

  async getRevenueByCategory(startDate, endDate) {
    const whereCondition = {};
    
    if (startDate && endDate) {
      whereCondition.createdAt = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    const orders = await prisma.order.findMany({
      where: whereCondition,
      include: {
        items: {
          include: {
            product: {
              select: {
                category: true,
              },
            },
          },
        },
      },
    });

    const revenueByCategory = {};

    orders.forEach(order => {
      order.items.forEach(item => {
        const category = item.product.category || 'Uncategorized';
        const revenue = item.price * item.quantity;
        
        if (!revenueByCategory[category]) {
          revenueByCategory[category] = 0;
        }
        
        revenueByCategory[category] += revenue;
      });
    });

    return Object.entries(revenueByCategory).map(([category, revenue]) => ({
      category,
      revenue,
    }));
  }

  async getRevenueGrowth(startDate, endDate) {
    if (!startDate || !endDate) return 0;

    const currentRevenue = await prisma.order.aggregate({
      where: {
        createdAt: {
          gte: new Date(startDate),
          lte: new Date(endDate),
        },
      },
      _sum: {
        total: true,
      },
    });

    const prevStartDate = new Date(new Date(startDate).getTime() - (30 * 24 * 60 * 60 * 1000));
    const prevEndDate = new Date(new Date(endDate).getTime() - (30 * 24 * 60 * 60 * 1000));

    const previousRevenue = await prisma.order.aggregate({
      where: {
        createdAt: {
          gte: prevStartDate,
          lte: prevEndDate,
        },
      },
      _sum: {
        total: true,
      },
    });

    const current = currentRevenue._sum.total || 0;
    const previous = previousRevenue._sum.total || 0;

    return previous > 0 ? ((current - previous) / previous) * 100 : 100;
  }
}

module.exports = new AnalyticsController();