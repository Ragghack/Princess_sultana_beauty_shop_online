const express = require("express");
const router = express.Router();
const productController = require("../controllers/productController_fixed");
const authenticate = require("../middleware/auth");
const authorize = require("../middleware/authorize");
const { validate, validations } = require("../utils/validators");
const { uploadProductImages } = require("../middleware/uploadMiddleware");

// Public routes
router.get("/", productController.getProducts);
router.get("/featured", productController.getFeaturedProducts);
router.get("/slug/:slug", productController.getProductBySlug);
router.get("/:id", productController.getProductById);

// Admin/Staff routes
router.post(
  "/",
  authenticate,
  authorize("ADMIN", "STAFF"),
  uploadProductImages,
  validations.createProduct,
  validate,
  productController.createProduct,
);

router.patch(
  "/:id",
  authenticate,
  authorize("ADMIN", "STAFF"),
  uploadProductImages,
  productController.updateProduct,
);

router.delete(
  "/:id",
  authenticate,
  authorize("ADMIN"),
  productController.deleteProduct,
);

router.patch(
  "/:id/inventory",
  authenticate,
  authorize("ADMIN", "STAFF"),
  productController.updateInventory,
);

module.exports = router;
