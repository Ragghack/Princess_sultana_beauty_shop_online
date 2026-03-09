const express = require("express");
const router = express.Router();
const analyticsController = require("../controllers/analyticsController");
const authenticate = require("../middleware/auth");
const authorize = require("../middleware/authorize");

// All routes require Admin/Staff access
router.use(authenticate, authorize("ADMIN", "STAFF"));

router.get("/dashboard", analyticsController.getDashboardAnalytics);
router.get("/sales", analyticsController.getSalesAnalytics);
router.get("/products", analyticsController.getProductAnalytics);
router.get("/customers", analyticsController.getCustomerAnalytics);
router.get("/revenue", analyticsController.getRevenueAnalytics);

module.exports = router;
