const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');
const Report = require('../models/Report');
const CustomerAnalytics = require('../models/CustomerAnalytics');

// Helper function to calculate date ranges
const calculateDateRange = (period) => {
    const now = new Date();
    const start = new Date();
    
    switch(period) {
        case 'daily':
            start.setDate(now.getDate() - 1);
            break;
        case 'weekly':
            start.setDate(now.getDate() - 7);
            break;
        case 'monthly':
            start.setMonth(now.getMonth() - 1);
            break;
        case 'quarterly':
            start.setMonth(now.getMonth() - 3);
            break;
        case 'yearly':
            start.setFullYear(now.getFullYear() - 1);
            break;
        default:
            start.setMonth(now.getMonth() - 1);
    }
    
    return { start, end: now };
};

// Generate sales report
exports.generateSalesReport = async (req, res) => {
    try {
        const { startDate, endDate, period = 'monthly' } = req.query;
        
        let start, end;
        
        if (startDate && endDate) {
            start = new Date(startDate);
            end = new Date(endDate);
            end.setHours(23, 59, 59, 999);
        } else {
            const range = calculateDateRange(period);
            start = range.start;
            end = range.end;
        }
        
        // Get orders within date range
        const orders = await Order.find({
            createdAt: { $gte: start, $lte: end },
            status: { $ne: 'cancelled' }
        }).populate('userId', 'name email phone')
          .populate('items.productId', 'name category price');
        
        // Calculate statistics
        let totalRevenue = 0;
        let totalOrders = orders.length;
        const customerSet = new Set();
        const productSales = {};
        const statusDistribution = {
            pending: 0,
            processing: 0,
            shipped: 0,
            delivered: 0,
            cancelled: 0
        };
        
        orders.forEach(order => {
            // Revenue calculation
            const orderAmount = order.amount || order.totalAmount || 0;
            totalRevenue += orderAmount;
            
            // Customer tracking
            if (order.userId) {
                customerSet.add(order.userId._id.toString());
            }
            
            // Status distribution
            if (order.status && statusDistribution.hasOwnProperty(order.status)) {
                statusDistribution[order.status]++;
            }
            
            // Product sales tracking
            if (order.items && order.items.length > 0) {
                order.items.forEach(item => {
                    if (item.productId) {
                        const productId = item.productId._id.toString();
                        if (!productSales[productId]) {
                            productSales[productId] = {
                                productId: item.productId._id,
                                name: item.productId.name,
                                category: item.productId.category,
                                quantity: 0,
                                revenue: 0
                            };
                        }
                        productSales[productId].quantity += item.quantity || 1;
                        productSales[productId].revenue += (item.price || item.productId.price || 0) * (item.quantity || 1);
                    }
                });
            }
        });
        
        const totalCustomers = customerSet.size;
        const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
        
        // Get top products (sorted by revenue)
        const topProducts = Object.values(productSales)
            .sort((a, b) => b.revenue - a.revenue)
            .slice(0, 10);
        
        // Calculate daily revenue for chart
        const dailyRevenue = {};
        orders.forEach(order => {
            const date = order.createdAt.toISOString().split('T')[0];
            const amount = order.amount || order.totalAmount || 0;
            
            if (!dailyRevenue[date]) {
                dailyRevenue[date] = 0;
            }
            dailyRevenue[date] += amount;
        });
        
        const revenueChartData = Object.keys(dailyRevenue)
            .sort()
            .map(date => ({
                date,
                revenue: dailyRevenue[date]
            }));
        
        // Calculate monthly revenue for comparison
        const monthlyRevenue = {};
        orders.forEach(order => {
            const month = order.createdAt.toISOString().substring(0, 7); // YYYY-MM
            const amount = order.amount || order.totalAmount || 0;
            
            if (!monthlyRevenue[month]) {
                monthlyRevenue[month] = 0;
            }
            monthlyRevenue[month] += amount;
        });
        
        const monthlySalesData = Object.keys(monthlyRevenue)
            .sort()
            .map(month => ({
                month,
                sales: monthlyRevenue[month]
            }));
        
        // Prepare response
        const reportData = {
            summary: {
                totalRevenue,
                totalOrders,
                totalCustomers,
                averageOrderValue,
                startDate: start,
                endDate: end
            },
            charts: {
                revenueData: revenueChartData,
                orderStatusData: Object.entries(statusDistribution).map(([status, count]) => ({
                    status,
                    count
                })).filter(item => item.count > 0),
                topProducts,
                monthlySales: monthlySalesData
            },
            orders: orders.slice(0, 50), // Last 50 orders for detail view
            period: period
        };
        
        // Save report to database
        const report = new Report({
            reportType: 'sales',
            period: period,
            startDate: start,
            endDate: end,
            generatedBy: req.user.userId || req.user.id,
            data: reportData,
            summary: {
                totalRevenue,
                totalOrders,
                totalCustomers,
                averageOrderValue,
                topProducts: topProducts.slice(0, 5),
                orderStatusDistribution: statusDistribution
            }
        });
        
        await report.save();
        
        res.status(200).json({
            success: true,
            message: 'Sales report generated successfully',
            data: reportData
        });
        
    } catch (error) {
        console.error('Error generating sales report:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to generate sales report',
            error: error.message
        });
    }
};

// Get customer analytics
exports.getCustomerAnalytics = async (req, res) => {
    try {
        const { startDate, endDate, limit = 100, sortBy = 'totalSpent' } = req.query;
        
        let filter = {};
        
        if (startDate && endDate) {
            filter.lastOrderDate = {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            };
        }
        
        // Get all customer analytics
        let customers = await CustomerAnalytics.find(filter)
            .sort({ [sortBy]: -1 })
            .limit(parseInt(limit));
        
        // If no analytics exist, generate them
        if (customers.length === 0) {
            await exports.generateCustomerAnalytics();
            customers = await CustomerAnalytics.find(filter)
                .sort({ [sortBy]: -1 })
                .limit(parseInt(limit));
        }
        
        // Calculate summary statistics
        const totalCustomers = await CustomerAnalytics.countDocuments();
        const totalRevenue = customers.reduce((sum, customer) => sum + customer.totalSpent, 0);
        const avgCustomerValue = totalCustomers > 0 ? totalRevenue / totalCustomers : 0;
        
        // Get top customers
        const topCustomers = customers.slice(0, 10);
        
        // Customer segmentation
        const segments = {
            vip: customers.filter(c => c.totalSpent > 100000).length,
            regular: customers.filter(c => c.totalSpent > 50000 && c.totalSpent <= 100000).length,
            occasional: customers.filter(c => c.totalSpent <= 50000).length
        };
        
        res.status(200).json({
            success: true,
            data: {
                customers,
                summary: {
                    totalCustomers,
                    totalRevenue,
                    averageCustomerValue: avgCustomerValue,
                    segments
                },
                topCustomers
            }
        });
        
    } catch (error) {
        console.error('Error getting customer analytics:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get customer analytics',
            error: error.message
        });
    }
};

// Generate customer analytics (background job)
exports.generateCustomerAnalytics = async () => {
    try {
        // Get all orders
        const orders = await Order.find({})
            .populate('userId', 'name email phone')
            .populate('items.productId', 'name category');
        
        // Group orders by customer
        const customerMap = new Map();
        
        orders.forEach(order => {
            if (order.userId) {
                const customerId = order.userId._id.toString();
                
                if (!customerMap.has(customerId)) {
                    customerMap.set(customerId, {
                        customerId: order.userId._id,
                        customerName: order.userId.name || 'Unknown',
                        customerEmail: order.userId.email || 'N/A',
                        orders: [],
                        totalSpent: 0,
                        firstOrderDate: null,
                        lastOrderDate: null,
                        categories: new Set()
                    });
                }
                
                const customer = customerMap.get(customerId);
                customer.orders.push(order);
                customer.totalSpent += order.amount || order.totalAmount || 0;
                
                // Update dates
                const orderDate = new Date(order.createdAt);
                if (!customer.firstOrderDate || orderDate < customer.firstOrderDate) {
                    customer.firstOrderDate = orderDate;
                }
                if (!customer.lastOrderDate || orderDate > customer.lastOrderDate) {
                    customer.lastOrderDate = orderDate;
                }
                
                // Track categories
                if (order.items && order.items.length > 0) {
                    order.items.forEach(item => {
                        if (item.productId && item.productId.category) {
                            customer.categories.add(item.productId.category);
                        }
                    });
                }
            }
        });
        
        // Calculate analytics for each customer
        const analyticsPromises = Array.from(customerMap.values()).map(async (customerData) => {
            const totalOrders = customerData.orders.length;
            const lifetimeInMonths = customerData.firstOrderDate ? 
                (new Date().getMonth() - customerData.firstOrderDate.getMonth() + 
                 (new Date().getFullYear() - customerData.firstOrderDate.getFullYear()) * 12) : 1;
            
            const orderFrequency = lifetimeInMonths > 0 ? totalOrders / lifetimeInMonths : totalOrders;
            
            // Find favorite category
            const categoryArray = Array.from(customerData.categories);
            const favoriteCategory = categoryArray.length > 0 ? categoryArray[0] : null;
            
            // Calculate retention score (simplified)
            const monthsSinceLastOrder = customerData.lastOrderDate ?
                (new Date().getMonth() - customerData.lastOrderDate.getMonth() + 
                 (new Date().getFullYear() - customerData.lastOrderDate.getFullYear()) * 12) : 0;
            
            let retentionScore = 100;
            if (monthsSinceLastOrder > 6) retentionScore = 20;
            else if (monthsSinceLastOrder > 3) retentionScore = 50;
            else if (monthsSinceLastOrder > 1) retentionScore = 80;
            
            // Update or create customer analytics
            await CustomerAnalytics.findOneAndUpdate(
                { customerId: customerData.customerId },
                {
                    customerName: customerData.customerName,
                    customerEmail: customerData.customerEmail,
                    totalOrders: totalOrders,
                    totalSpent: customerData.totalSpent,
                    averageOrderValue: totalOrders > 0 ? customerData.totalSpent / totalOrders : 0,
                    firstOrderDate: customerData.firstOrderDate,
                    lastOrderDate: customerData.lastOrderDate,
                    favoriteCategory: favoriteCategory,
                    orderFrequency: orderFrequency,
                    customerLifetimeValue: customerData.totalSpent,
                    retentionScore: retentionScore
                },
                { upsert: true, new: true }
            );
        });
        
        await Promise.all(analyticsPromises);
        
        console.log('Customer analytics generated successfully');
        return true;
        
    } catch (error) {
        console.error('Error generating customer analytics:', error);
        throw error;
    }
};

// Get product performance report
exports.getProductPerformance = async (req, res) => {
    try {
        const { startDate, endDate, category } = req.query;
        
        let filter = {};
        
        if (startDate && endDate) {
            filter.createdAt = {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            };
        }
        
        // Get all orders
        const orders = await Order.find(filter).populate('items.productId', 'name category price stock');
        
        // Analyze product performance
        const productPerformance = {};
        
        orders.forEach(order => {
            if (order.items && order.items.length > 0) {
                order.items.forEach(item => {
                    if (item.productId) {
                        const productId = item.productId._id.toString();
                        
                        if (!productPerformance[productId]) {
                            productPerformance[productId] = {
                                productId: item.productId._id,
                                name: item.productId.name,
                                category: item.productId.category,
                                stock: item.productId.stock || 0,
                                totalSold: 0,
                                totalRevenue: 0,
                                ordersCount: 0
                            };
                        }
                        
                        const quantity = item.quantity || 1;
                        const price = item.price || item.productId.price || 0;
                        
                        productPerformance[productId].totalSold += quantity;
                        productPerformance[productId].totalRevenue += price * quantity;
                        productPerformance[productId].ordersCount++;
                    }
                });
            }
        });
        
        // Convert to array and sort
        let products = Object.values(productPerformance);
        
        // Filter by category if specified
        if (category) {
            products = products.filter(p => p.category === category);
        }
        
        // Sort by revenue (descending)
        products.sort((a, b) => b.totalRevenue - a.totalRevenue);
        
        // Calculate inventory turnover
        products.forEach(product => {
            product.inventoryTurnover = product.stock > 0 ? 
                (product.totalSold / product.stock) * 100 : 0;
        });
        
        // Category performance
        const categoryPerformance = {};
        products.forEach(product => {
            if (!categoryPerformance[product.category]) {
                categoryPerformance[product.category] = {
                    totalRevenue: 0,
                    totalSold: 0,
                    productsCount: 0
                };
            }
            categoryPerformance[product.category].totalRevenue += product.totalRevenue;
            categoryPerformance[product.category].totalSold += product.totalSold;
            categoryPerformance[product.category].productsCount++;
        });
        
        res.status(200).json({
            success: true,
            data: {
                products,
                summary: {
                    totalProducts: products.length,
                    totalRevenue: products.reduce((sum, p) => sum + p.totalRevenue, 0),
                    totalSold: products.reduce((sum, p) => sum + p.totalSold, 0),
                    categoryPerformance
                },
                topPerforming: products.slice(0, 10),
                lowStock: products.filter(p => p.stock < 10).slice(0, 10)
            }
        });
        
    } catch (error) {
        console.error('Error getting product performance:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get product performance',
            error: error.message
        });
    }
};

// Export report to PDF/Excel
exports.exportReport = async (req, res) => {
    try {
        const { reportType, format, startDate, endDate } = req.body;
        
        // Generate report data
        let reportData;
        
        switch(reportType) {
            case 'sales':
                // Use the sales report logic
                const salesReq = { query: { startDate, endDate } };
                const salesRes = {
                    json: (data) => { reportData = data; }
                };
                await exports.generateSalesReport(salesReq, salesRes);
                break;
                
            case 'customers':
                // Use customer analytics logic
                const custReq = { query: { startDate, endDate } };
                const custRes = {
                    json: (data) => { reportData = data; }
                };
                await exports.getCustomerAnalytics(custReq, custRes);
                break;
                
            case 'products':
                // Use product performance logic
                const prodReq = { query: { startDate, endDate } };
                const prodRes = {
                    json: (data) => { reportData = data; }
                };
                await exports.getProductPerformance(prodReq, prodRes);
                break;
                
            default:
                throw new Error('Invalid report type');
        }
        
        // Here you would typically:
        // 1. Generate PDF using libraries like pdfkit or jspdf
        // 2. Generate Excel using libraries like exceljs
        // 3. Save the file and return the download link
        
        // For now, return the data with instructions
        res.status(200).json({
            success: true,
            message: `Report ready for ${format.toUpperCase()} export`,
            data: reportData,
            exportInfo: {
                format: format,
                fileName: `${reportType}_report_${new Date().toISOString().split('T')[0]}.${format}`,
                generatedAt: new Date()
            }
        });
        
    } catch (error) {
        console.error('Error exporting report:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to export report',
            error: error.message
        });
    }
};

// Get saved reports
exports.getSavedReports = async (req, res) => {
    try {
        const { type, page = 1, limit = 20 } = req.query;
        
        let filter = { generatedBy: req.user.id };
        if (type) {
            filter.reportType = type;
        }
        
        const reports = await Report.find(filter)
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit))
            .populate('generatedBy', 'name email');
        
        const total = await Report.countDocuments(filter);
        
        res.status(200).json({
            success: true,
            data: reports,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        });
        
    } catch (error) {
        console.error('Error getting saved reports:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get saved reports',
            error: error.message
        });
    }
};

// Delete report
exports.deleteReport = async (req, res) => {
    try {
        const { id } = req.params;
        
        const report = await Report.findById(id);
        
        if (!report) {
            return res.status(404).json({
                success: false,
                message: 'Report not found'
            });
        }
        
        // Check if user owns the report
        if (report.generatedBy.toString() !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to delete this report'
            });
        }
        
        await report.remove();
        
        res.status(200).json({
            success: true,
            message: 'Report deleted successfully'
        });
        
    } catch (error) {
        console.error('Error deleting report:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete report',
            error: error.message
        });
    }
};