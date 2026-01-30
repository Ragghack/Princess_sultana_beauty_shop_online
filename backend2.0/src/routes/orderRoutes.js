const express = require("express");
const router = express.Router();
const orderController = require("../controllers/orderController");
const authenticate = require("../middleware/auth");
const authorize = require("../middleware/authorize");
const { validate, validations } = require("../utils/validators");

// All routes require authentication
router.use(authenticate);

router.get("/", orderController.getOrders);
router.post(
  "/",
  validations.createOrder,
  validate,
  orderController.createOrder,
);
router.get("/:id", orderController.getOrderById);

// Customer/Admin routes
router.patch("/:id/cancel", orderController.cancelOrder);

// Admin/Staff routes
router.patch(
  "/:id/status",
  authorize("ADMIN", "STAFF"),
  orderController.updateOrderStatus,
);

router.patch(
  "/:id/assign-delivery",
  authorize("ADMIN", "STAFF"),
  orderController.assignDelivery,
);

// Delivery routes
router.patch(
  "/:id/mark-delivered",
  authorize("DELIVERY"),
  orderController.markAsDelivered,
);

module.exports = router;
