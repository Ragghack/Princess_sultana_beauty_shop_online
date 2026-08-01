const prisma = require("../config/database");
const ApiResponse = require("../utils/ApiResponse");
const asyncHandler = require("../utils/asyncHandler");

class AnalyticsController {
  /**
   * @route   GET /api/v1/analytics/dashboard
   * @desc    Get dashboard analytics
   * @access  Private (Admin/Staff)
   */
  getDashboardAnalytics = asyncHandler(async (req, res) => {
    const today = new Date();
    const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
    const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    // Get total orders
    const totalOrders = await prisma.order.count();

    // Get total revenue
    const revenueData = await prisma.order.aggregate({
      where: {
        paymentStatus: "COMPLETED",
      },
      _sum: {
        total: true,
      },
    });

    // Get total customers
    const totalCustomers = await prisma.user.count({
      where: { role: "CUSTOMER" },
    });

    // Get pending orders
    const pendingOrders = await prisma.order.count({
      where: { status: "PENDING" },
    });

    // Get orders from last 30 days
    const ordersLast30Days = await prisma.order.count({
      where: {
        createdAt: {
          gte: thirtyDaysAgo,
        },
      },
    });

    // Get this month revenue
    const thisMonthRevenue = await prisma.order.aggregate({
      where: {
        paymentStatus: "COMPLETED",
        createdAt: {
          gte: thisMonth,
        },
      },
      _sum: {
        total: true,
      },
    });

    // Get last month revenue
    const lastMonthRevenue = await prisma.order.aggregate({
      where: {
        paymentStatus: "COMPLETED",
        createdAt: {
          gte: lastMonth,
          lt: thisMonth,
        },
      },
      _sum: {
        total: true,
      },
    });

    // Calculate revenue growth
    const revenueGrowth = lastMonthRevenue._sum.total
      ? (
          (((thisMonthRevenue._sum.total || 0) - lastMonthRevenue._sum.total) /
            lastMonthRevenue._sum.total) *
          100
        ).toFixed(2)
      : 0;

    // Get recent orders
    const recentOrders = await prisma.order.findMany({
      take: 10,
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    // Get sales data for chart (last 7 days)
    const salesData = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);

      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      const dayOrders = await prisma.order.count({
        where: {
          createdAt: {
            gte: date,
            lt: nextDate,
          },
        },
      });

      const dayRevenue = await prisma.order.aggregate({
        where: {
          paymentStatus: "COMPLETED",
          createdAt: {
            gte: date,
            lt: nextDate,
          },
        },
        _sum: {
          total: true,
        },
      });

      salesData.push({
        date: date.toISOString().split("T")[0],
        month: date.toLocaleDateString("fr-FR", { month: "short" }),
        orders: dayOrders,
        revenue: parseFloat(dayRevenue._sum.total || 0),
      });
    }

    res.status(200).json(
      new ApiResponse(200, {
        stats: {
          totalOrders,
          totalRevenue: parseFloat(revenueData._sum.total || 0),
          totalCustomers,
          pendingOrders,
          ordersLast30Days,
          revenueGrowth: parseFloat(revenueGrowth),
        },
        recentOrders,
        salesData,
      }),
    );
  });

  /**
   * @route   GET /api/v1/analytics/sales
   * @desc    Get sales analytics
   * @access  Private (Admin/Staff)
   */
  getSalesAnalytics = asyncHandler(async (req, res) => {
    const { startDate, endDate, groupBy = "day" } = req.query;

    const start = startDate
      ? new Date(startDate)
      : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();

    // Get orders in date range
    const orders = await prisma.order.findMany({
      where: {
        createdAt: {
          gte: start,
          lte: end,
        },
        paymentStatus: "COMPLETED",
      },
      select: {
        createdAt: true,
        total: true,
        items: {
          select: {
            quantity: true,
            subtotal: true,
          },
        },
      },
    });

    // Group by date
    const groupedData = {};

    orders.forEach((order) => {
      let dateKey;
      const orderDate = new Date(order.createdAt);

      if (groupBy === "month") {
        dateKey = `${orderDate.getFullYear()}-${String(orderDate.getMonth() + 1).padStart(2, "0")}`;
      } else if (groupBy === "week") {
        const weekNumber = Math.ceil(orderDate.getDate() / 7);
        dateKey = `${orderDate.getFullYear()}-W${weekNumber}`;
      } else {
        dateKey = orderDate.toISOString().split("T")[0];
      }

      if (!groupedData[dateKey]) {
        groupedData[dateKey] = {
          date: dateKey,
          orders: 0,
          revenue: 0,
          items: 0,
        };
      }

      groupedData[dateKey].orders += 1;
      groupedData[dateKey].revenue += parseFloat(order.total);
      groupedData[dateKey].items += order.items.reduce(
        (sum, item) => sum + item.quantity,
        0,
      );
    });

    const salesData = Object.values(groupedData).sort((a, b) =>
      a.date.localeCompare(b.date),
    );

    res.status(200).json(new ApiResponse(200, salesData));
  });

  /**
   * @route   GET /api/v1/analytics/products
   * @desc    Get product analytics
   * @access  Private (Admin/Staff)
   */
  getProductAnalytics = asyncHandler(async (req, res) => {
    // Top selling products
    const topProducts = await prisma.product.findMany({
      take: 10,
      orderBy: { salesCount: "desc" },
      select: {
        id: true,
        name: true,
        sku: true,
        salesCount: true,
        stockQuantity: true,
        price: true,
      },
    });

    // Low stock products
    const lowStockProducts = await prisma.product.findMany({
      where: {
        stockQuantity: {
          lte: 10, // Using hardcoded value instead of field reference
        },
        status: "ACTIVE",
      },
      select: {
        id: true,
        name: true,
        sku: true,
        stockQuantity: true,
        lowStockThreshold: true,
      },
    });

    // Products by category
    const productsByCategory = await prisma.product.groupBy({
      by: ["category"],
      _count: {
        id: true,
      },
      _sum: {
        salesCount: true,
      },
      where: {
        deletedAt: null,
      },
    });

    res.status(200).json(
      new ApiResponse(200, {
        topProducts,
        lowStockProducts,
        productsByCategory,
      }),
    );
  });

  /**
   * @route   GET /api/v1/analytics/customers
   * @desc    Get customer analytics
   * @access  Private (Admin/Staff)
   */
  getCustomerAnalytics = asyncHandler(async (req, res) => {
    // Total customers
    const totalCustomers = await prisma.user.count({
      where: { role: "CUSTOMER" },
    });

    // New customers this month
    const thisMonth = new Date(
      new Date().getFullYear(),
      new Date().getMonth(),
      1,
    );
    const newCustomers = await prisma.user.count({
      where: {
        role: "CUSTOMER",
        createdAt: {
          gte: thisMonth,
        },
      },
    });

    // Top customers by order value
    const topCustomers = await prisma.user.findMany({
      where: { role: "CUSTOMER" },
      take: 10,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        orders: {
          where: {
            paymentStatus: "COMPLETED",
          },
          select: {
            total: true,
          },
        },
      },
    });

    const topCustomersWithTotal = topCustomers
      .map((customer) => ({
        id: customer.id,
        firstName: customer.firstName,
        lastName: customer.lastName,
        email: customer.email,
        totalSpent: customer.orders.reduce(
          (sum, order) => sum + parseFloat(order.total),
          0,
        ),
        orderCount: customer.orders.length,
      }))
      .sort((a, b) => b.totalSpent - a.totalSpent);

    // Customer acquisition by month (last 6 months)
    const acquisitionData = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
      const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);

      const count = await prisma.user.count({
        where: {
          role: "CUSTOMER",
          createdAt: {
            gte: startOfMonth,
            lte: endOfMonth,
          },
        },
      });

      acquisitionData.push({
        month: startOfMonth.toISOString().slice(0, 7),
        customers: count,
      });
    }

    res.status(200).json(
      new ApiResponse(200, {
        totalCustomers,
        newCustomers,
        topCustomers: topCustomersWithTotal,
        acquisitionData,
      }),
    );
  });

  /**
   * @route   GET /api/v1/analytics/revenue
   * @desc    Get revenue breakdown
   * @access  Private (Admin/Staff)
   */
  getRevenueAnalytics = asyncHandler(async (req, res) => {
    const { startDate, endDate } = req.query;

    const start = startDate
      ? new Date(startDate)
      : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();

    // Total revenue
    const totalRevenue = await prisma.order.aggregate({
      where: {
        paymentStatus: "COMPLETED",
        createdAt: {
          gte: start,
          lte: end,
        },
      },
      _sum: {
        total: true,
        subtotal: true,
        deliveryFee: true,
        discount: true,
      },
    });

    // Revenue by payment method
    const revenueByPaymentMethod = await prisma.order.groupBy({
      by: ["paymentMethod"],
      where: {
        paymentStatus: "COMPLETED",
        createdAt: {
          gte: start,
          lte: end,
        },
      },
      _sum: {
        total: true,
      },
      _count: {
        id: true,
      },
    });

    // Revenue by category
    const revenueByCategory = await prisma.orderItem.groupBy({
      by: ["productId"],
      where: {
        order: {
          paymentStatus: "COMPLETED",
          createdAt: {
            gte: start,
            lte: end,
          },
        },
      },
      _sum: {
        subtotal: true,
      },
    });

    // Get product categories for the items
    const productIds = revenueByCategory.map((item) => item.productId);
    const products = await prisma.product.findMany({
      where: {
        id: { in: productIds },
      },
      select: {
        id: true,
        category: true,
      },
    });

    const categoryRevenue = {};
    revenueByCategory.forEach((item) => {
      const product = products.find((p) => p.id === item.productId);
      if (product) {
        if (!categoryRevenue[product.category]) {
          categoryRevenue[product.category] = 0;
        }
        categoryRevenue[product.category] += parseFloat(item._sum.subtotal);
      }
    });

    res.status(200).json(
      new ApiResponse(200, {
        totalRevenue: {
          total: parseFloat(totalRevenue._sum.total || 0),
          subtotal: parseFloat(totalRevenue._sum.subtotal || 0),
          deliveryFees: parseFloat(totalRevenue._sum.deliveryFee || 0),
          discounts: parseFloat(totalRevenue._sum.discount || 0),
        },
        revenueByPaymentMethod,
        revenueByCategory: Object.entries(categoryRevenue).map(
          ([category, revenue]) => ({
            category,
            revenue,
          }),
        ),
      }),
    );
  });
}

module.exports = new AnalyticsController();
