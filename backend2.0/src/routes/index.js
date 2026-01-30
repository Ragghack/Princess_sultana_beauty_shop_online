const express = require("express");
const router = express.Router();

const authRoutes = require("./authRoutes");
const productRoutes = require("./productRoutes");
const orderRoutes = require("./orderRoutes");
const cartRoutes = require("./cartRoutes");
const discountRoutes = require("./discountRoutes");
const analyticsRoutes = require("./analyticsRoutes");

// Mount routes
router.use("/auth", authRoutes);
router.use("/products", productRoutes);
router.use("/orders", orderRoutes);
router.use("/cart", cartRoutes);
router.use("/discounts", discountRoutes);
router.use("/analytics", analyticsRoutes);

// Health check
router.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Server is running",
    timestamp: new Date().toISOString(),
  });
});

module.exports = router;
