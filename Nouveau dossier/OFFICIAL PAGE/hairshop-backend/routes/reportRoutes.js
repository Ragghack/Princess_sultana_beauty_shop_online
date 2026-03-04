const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const auth = require('../middleware/Auth'); // Import the function directly

// Import Models for the inline dashboard logic
const Order = require('../models/Order');
const Product = require('../models/Product');
// Assuming CustomerAnalytics is a model you've created
// const CustomerAnalytics = require('../models/CustomerAnalytics'); 

/**
 * @description Authentication & Authorization
 * Since your Auth.js middleware handles both token verification 
 * and admin checks (based on the originalUrl logic inside it), 
 * we just need to apply it to all report routes.
 */
router.use(auth);

// --- Sales Reports ---

// GET /api/admin/reports/sales
router.get('/sales', reportController.generateSalesReport);

// GET /api/admin/reports/sales/summary
router.get('/sales/summary', async (req, res) => {
    try {
        // Fetch data from the last 30 days
        const oneMonthAgo = new Date();
        oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

        const orders = await Order.find({
            createdAt: { $gte: oneMonthAgo }
        });
        
        const totalRevenue = orders.reduce((sum, order) => sum + (order.amount || 0), 0);
        const totalOrders = orders.length;
        const avgOrderValue = totalOrders > 0 ? (totalRevenue / totalOrders) : 0;
        
        // Use a Set to count unique user IDs
        const uniqueCustomers = new Set(orders.map(o => o.userId?.toString())).size;

        res.json({
            success: true,
            summary: {
                totalRevenue,
                totalOrders,
                averageOrderValue: Math.round(avgOrderValue),
                totalCustomers: uniqueCustomers,
                period: "Last 30 Days"
            }
        });
    } catch (error) {
        console.error('Summary Report Error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// --- Product & Inventory Analytics ---

// GET /api/admin/reports/products
router.get('/products', reportController.getProductPerformance);

router.get('/products/inventory', async (req, res) => {
    try {
        const products = await Product.find().select('name stock price category');
        
        const lowStock = products.filter(p => p.stock > 0 && p.stock < 10);
        const outOfStock = products.filter(p => p.stock === 0);
        
        res.json({
            success: true,
            inventory: {
                totalProducts: products.length,
                lowStockCount: lowStock.length,
                outOfStockCount: outOfStock.length,
                criticalItems: lowStock.slice(0, 10) // Return first 10 for quick view
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// --- Chart Data (Visualizations) ---

router.get('/charts', async (req, res) => {
    try {
        const { start, end } = req.query;
        let startDate = start ? new Date(start) : new Date(new Date().setMonth(new Date().getMonth() - 6));
        let endDate = end ? new Date(end) : new Date();

        const orders = await Order.find({
            createdAt: { $gte: startDate, $lte: endDate }
        });

        // Data Aggregation
        const monthlyRevenue = {};
        const statusCount = {};
        const productSales = {};

        orders.forEach(order => {
            // 1. Monthly Revenue
            const month = order.createdAt.toISOString().substring(0, 7); // YYYY-MM
            monthlyRevenue[month] = (monthlyRevenue[month] || 0) + (order.amount || 0);
            
            // 2. Status Distribution
            const status = order.status || 'pending';
            statusCount[status] = (statusCount[status] || 0) + 1;
            
            // 3. Product Performance
            if (order.items) {
                order.items.forEach(item => {
                    const name = item.name || 'Unknown';
                    productSales[name] = (productSales[name] || 0) + (item.quantity || 1);
                });
            }
        });

        res.json({
            success: true,
            charts: {
                revenue: Object.entries(monthlyRevenue).map(([label, value]) => ({ label, value })),
                status: Object.entries(statusCount).map(([name, value]) => ({ name, value })),
                topProducts: Object.entries(productSales)
                    .map(([name, sales]) => ({ name, sales }))
                    .sort((a, b) => b.sales - a.sales)
                    .slice(0, 5)
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});


// --- Controller Handlers ---

router.post('/export', reportController.exportReport);
router.get('/saved', reportController.getSavedReports);
router.delete('/saved/:id', reportController.deleteReport);

module.exports = router;