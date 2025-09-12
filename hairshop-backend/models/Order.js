const mongoose = require('mongoose');
const orderSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  items: [{ product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' }, qty: Number, price: Number }],
  status: { type: String, default: 'pending' },
  paymentMethod: String,
  amount: Number,
  trackingNumber: String
}, { timestamps: true });
module.exports = mongoose.model('Order', orderSchema);
