const express = require("express");
const router = express.Router();
const bundleController = require("../controllers/bundleController");
const authenticate = require("../middleware/auth");
const authorize = require("../middleware/authorize");

/**
 * Public routes
 */
router.get("/", bundleController.getBundles);
router.get("/slug/:slug", bundleController.getBundleBySlug);
router.get("/:id", bundleController.getBundleById);
router.get("/:id/stock-check", bundleController.checkBundleStock);

/**
 * Protected routes (Admin/Staff only)
 */
router.post(
  "/",
  authenticate,
  authorize("ADMIN", "STAFF"),
  bundleController.createBundle,
);

router.patch(
  "/:id",
  authenticate,
  authorize("ADMIN", "STAFF"),
  bundleController.updateBundle,
);

router.delete(
  "/:id",
  authenticate,
  authorize("ADMIN"),
  bundleController.deleteBundle,
);

module.exports = router;
