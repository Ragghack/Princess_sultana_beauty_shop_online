const mongoose = require('mongoose');
const productSchema = new mongoose.Schema({
  name: String,
  description: String,
  category: String,
  price: Number,
  currency: { type: String, default: 'XAF' },
  stock: Number,
  imageURL: String
}, { timestamps: true });
module.exports = mongoose.model('Product', productSchema);
