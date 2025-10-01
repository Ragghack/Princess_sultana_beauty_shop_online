const express = require("express");
const router = express.Router();
const User = require("../models/User");
const Product = require("../models/Product");
const Command = require("../models/Command");

// ============================
// 🔑 ADMIN ROUTES
// ============================

// ✅ Add a subscriber (create user with role "customer")
router.post("/add-subscriber", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const newUser = new User({
      name,
      email,
      password, // ⚠️ In real app, hash with bcrypt before saving
      role: "customer",
    });

    await newUser.save();
    res.status(201).json({ message: "Subscriber added successfully", user: newUser });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ Remove subscriber by ID
router.delete("/remove-subscriber/:id", async (req, res) => {
  try {
    const deletedUser = await User.findByIdAndDelete(req.params.id);
    if (!deletedUser) return res.status(404).json({ message: "Subscriber not found" });

    res.json({ message: "Subscriber removed successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ Update product stock
router.patch("/update-stock/:productId", async (req, res) => {
  try {
    const { stock } = req.body;
    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.productId,
      { stock },
      { new: true }
    );
    if (!updatedProduct) return res.status(404).json({ message: "Product not found" });

    res.json({ message: "Stock updated", product: updatedProduct });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ View all commands (orders)
router.get("/commands", async (req, res) => {
  try {
    const commands = await Command.find().populate("userId", "name email");
    res.json(commands);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ Update command status (queue: pending → processing → completed)
router.patch("/update-command/:id", async (req, res) => {
  try {
    const { status } = req.body; // expected: "pending", "processing", "completed"

    const updatedCommand = await Command.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!updatedCommand) return res.status(404).json({ message: "Command not found" });

    res.json({ message: "Command status updated", command: updatedCommand });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
