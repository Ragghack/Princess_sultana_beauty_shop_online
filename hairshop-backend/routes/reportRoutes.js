const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { protect, authorize } = require('../middleware/auth');

// All routes are protected and require admin role
router.use(protect);
router.use(authorize('admin'));

// Sales Reports
router.get('/sales', reportController.generateSalesReport);
router.get('/sales/summary', async (req, res) => {
    // Quick summary endpoint
    try {
        const orders = await Order.find({
            createdAt: { 
                $gte: new Date(new Date().setMonth(new Date().getMonth() - 1))
            }
        });
        
        const totalRevenue = orders.reduce((sum, order) => sum + (order.amount || 0), 0);
        const totalOrders = orders.length;
        const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
        
        res.json({
            totalRevenue,
            totalOrders,
            averageOrderValue: avgOrderValue,
            totalCustomers: new Set(orders.map(o => o.userId?.toString())).size
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Customer Analytics
router.get('/customers', reportController.getCustomerAnalytics);
router.get('/customers/top', async (req, res) => {
    // Get top customers only
    try {
        const customers = await CustomerAnalytics.find()
            .sort({ totalSpent: -1 })
            .limit(10);
        
        res.json({ customers });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Product Performance
router.get('/products', reportController.getProductPerformance);
router.get('/products/inventory', async (req, res) => {
    // Inventory report
    try {
        const products = await Product.find()
            .sort({ stock: 1 })
            .limit(50);
        
        const lowStock = products.filter(p => p.stock < 10);
        const outOfStock = products.filter(p => p.stock === 0);
        
        res.json({
            totalProducts: products.length,
            lowStock: lowStock.length,
            outOfStock: outOfStock.length,
            products: products.slice(0, 20)
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Chart Data
router.get('/charts', async (req, res) => {
    try {
        const { start, end } = req.query;
        
        const filter = {};
        if (start && end) {
            filter.createdAt = {
                $gte: new Date(start),
                $lte: new Date(end)
            };
        } else {
            // Last 6 months by default
            filter.createdAt = {
                $gte: new Date(new Date().setMonth(new Date().getMonth() - 6))
            };
        }
        
        const orders = await Order.find(filter);
        
        // Revenue by month
        const monthlyRevenue = {};
        // Status distribution
        const statusCount = {};
        // Product sales
        const productSales = {};
        
        orders.forEach(order => {
            // Monthly revenue
            const month = order.createdAt.toISOString().substring(0, 7);
            monthlyRevenue[month] = (monthlyRevenue[month] || 0) + (order.amount || 0);
            
            // Status
            const status = order.status || 'unknown';
            statusCount[status] = (statusCount[status] || 0) + 1;
            
            // Product sales (simplified)
            if (order.items && order.items.length > 0) {
                order.items.forEach(item => {
                    const productName = item.name || 'Unknown';
                    productSales[productName] = (productSales[productName] || 0) + (item.quantity || 1);
                });
            }
        });
        
        // Format data for charts
        const revenueData = Object.entries(monthlyRevenue)
            .map(([month, revenue]) => ({ month, revenue }))
            .sort((a, b) => a.month.localeCompare(b.month));
        
        const orderStatusData = Object.entries(statusCount)
            .map(([status, count]) => ({ status, count }));
        
        const topProducts = Object.entries(productSales)
            .map(([name, sales]) => ({ name, sales }))
            .sort((a, b) => b.sales - a.sales)
            .slice(0, 10);
        
        res.json({
            revenueData,
            orderStatusData,
            topProducts,
            monthlySales: revenueData // For monthly sales chart
        });
        
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Export reports
router.post('/export', reportController.exportReport);

// Saved reports management
router.get('/saved', reportController.getSavedReports);
router.delete('/saved/:id', reportController.deleteReport);

// Background job to update analytics (call this periodically)
router.post('/update-analytics', async (req, res) => {
    try {
        await reportController.generateCustomerAnalytics();
        res.json({ success: true, message: 'Analytics updated successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;