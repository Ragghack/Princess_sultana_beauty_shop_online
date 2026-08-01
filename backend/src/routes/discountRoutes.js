const express = require("express");
const router = express.Router();
const discountController = require("../controllers/discountController");
const authenticate = require("../middleware/auth");
const authorize = require("../middleware/authorize");
const { validate, validations } = require("../utils/validators");

// Customer routes
router.post(
  "/validate",
  authenticate,
  validations.validateDiscountCode,
  validate,
  discountController.validateDiscountCode,
);

// Admin/Staff routes
router.get(
  "/",
  authenticate,
  authorize("ADMIN", "STAFF"),
  discountController.getDiscountCodes,
);

router.post(
  "/",
  authenticate,
  authorize("ADMIN"),
  discountController.createDiscountCode,
);

router.patch(
  "/:id",
  authenticate,
  authorize("ADMIN"),
  discountController.updateDiscountCode,
);

router.delete(
  "/:id",
  authenticate,
  authorize("ADMIN"),
  discountController.deleteDiscountCode,
);

router.patch(
  "/:id/toggle-status",
  authenticate,
  authorize("ADMIN"),
  discountController.toggleStatus,
);

module.exports = router;
