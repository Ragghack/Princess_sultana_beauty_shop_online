const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
   name: { type: String, required: true },
  description: { type: String, required: true },
  category: { type: String, required: true },
  price: { type: Number, required: true }, // For shop compatibility
  retailPrice: { type: Number, required: true }, // For admin dashboard
  wholesalePrice: Number,
  stock: { type: Number, default: 0 }, // For shop compatibility
  retailQuantity: { type: Number, default: 0 }, // For admin dashboard
  bulkQuantity: Number,
  bulkUnit: String,
  tag: { type: String, default: 'Premium' },
  imageURL: String,
  status: { type: String, default: 'active' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Product", productSchema);