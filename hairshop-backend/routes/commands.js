const express = require("express");
const router = express.Router();
const Command = require("../models/Command");

// ============================
// 🛒 COMMAND (ORDER) ROUTES
// ============================

// ✅ Create a new command (order)
router.post("/", async (req, res) => {
  try {
    const { userId, products } = req.body;

    if (!userId || !products || products.length === 0) {
      return res.status(400).json({ message: "Missing user or products" });
    }

    const newCommand = new Command({
      userId,
      products,
      status: "pending", // default when created
    });

    await newCommand.save();
    res.status(201).json({ message: "Command created successfully", command: newCommand });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ Get all commands for a specific user
router.get("/user/:userId", async (req, res) => {
  try {
    const userCommands = await Command.find({ userId: req.params.userId }).populate("products.productId");
    res.json(userCommands);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ Get a single command by ID
router.get("/:id", async (req, res) => {
  try {
    const command = await Command.findById(req.params.id).populate("products.productId");
    if (!command) return res.status(404).json({ message: "Command not found" });

    res.json(command);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ Cancel a command (only if still pending)
router.delete("/:id", async (req, res) => {
  try {
    const command = await Command.findById(req.params.id);
    if (!command) return res.status(404).json({ message: "Command not found" });

    if (command.status !== "pending") {
      return res.status(400).json({ message: "Only pending commands can be cancelled" });
    }

    await Command.findByIdAndDelete(req.params.id);
    res.json({ message: "Command cancelled successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
