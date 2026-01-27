const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const authenticate = require("../middleware/auth");
const { validate, validations } = require("../utils/validators");
const { authLimiter } = require("../middleware/rateLimiter");

// Public routes
router.post(
  "/register",
  authLimiter,
  validations.register,
  validate,
  authController.register,
);
router.post(
  "/login",
  authLimiter,
  validations.login,
  validate,
  authController.login,
);
router.post("/refresh-token", authController.refreshToken);

// Protected routes
router.post("/logout", authenticate, authController.logout);
router.get("/me", authenticate, authController.getCurrentUser);

module.exports = router;
