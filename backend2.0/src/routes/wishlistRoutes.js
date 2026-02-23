const express = require("express");
const router = express.Router();
const wishlistController = require("../controllers/wishlistController");
const authenticate = require("../middleware/auth");

/**
 * All wishlist routes require authentication
 */
router.use(authenticate);

// Get wishlist
router.get("/", wishlistController.getWishlist);

// Add to wishlist
router.post("/items", wishlistController.addToWishlist);

// Remove from wishlist
router.delete("/items/:id", wishlistController.removeFromWishlist);

// Clear wishlist
router.delete("/clear", wishlistController.clearWishlist);

// Move item to cart
router.post("/move-to-cart/:id", wishlistController.moveToCart);

// Check if item is in wishlist
router.get("/check/:productId", wishlistController.checkInWishlist);

module.exports = router;
