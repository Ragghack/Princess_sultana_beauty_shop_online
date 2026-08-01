const express = require("express");
const router = express.Router();
const orderController = require("../controllers/orderController");
const authenticate = require("../middleware/auth");
const authorize = require("../middleware/authorize");
const { uploadPaymentProof } = require("../middleware/uploadMiddleware");
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

// Customer routes
router.patch("/:id/cancel", orderController.cancelOrder);
router.post(
  "/:id/payment-proof",
  uploadPaymentProof,
  orderController.uploadPaymentProof,
);

// Admin/Staff routes
router.patch(
  "/:id/status",
  authorize("ADMIN", "STAFF"),
  orderController.updateOrderStatus,
);

router.patch(
  "/:id/verify-payment",
  authorize("ADMIN", "STAFF"),
  orderController.verifyPayment,
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