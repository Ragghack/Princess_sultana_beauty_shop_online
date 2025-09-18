const mongoose = require("mongoose");

const commandSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  products: [{ productId: String, quantity: Number }],
  status: { type: String, enum: ["pending", "processing", "completed"], default: "pending" }
}, { timestamps: true });

module.exports = mongoose.model("Command", commandSchema);
