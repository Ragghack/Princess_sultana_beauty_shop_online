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
  images: [{
    url: String,
    altText: { type: String, default: '' },
    isPrimary: { type: Boolean, default: false }
  }],
  imageURL: { type: String }, // Ensure this exists
  status: { type: String, default: 'active' },
  createdAt: { type: Date, default: Date.now }
});
module.exports = mongoose.model("Product", productSchema);