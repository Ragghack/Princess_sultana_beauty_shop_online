const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  category: { type: String, required: true },
  price: { type: Number, required: true },
  retailPrice: { type: Number, required: true },
  wholesalePrice: Number,
  stock: { type: Number, default: 0 },
  retailQuantity: { type: Number, default: 0 },
  bulkQuantity: Number,
  bulkUnit: String,
  tag: { type: String, default: 'Premium' },
  // ✅ Support multiple images
  images: [{
    url: String,
    altText: { type: String, default: '' },
    isPrimary: { type: Boolean, default: false }
  }],
  // ✅ Keep imageURL for backward compatibility
  imageURL: String,
  status: { type: String, default: 'active' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Product", productSchema);