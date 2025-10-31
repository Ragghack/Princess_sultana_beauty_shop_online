const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  items: [{ 
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' }, 
    qty: { type: Number, required: true },
    price: { type: Number, required: true }
  }],
  status: { 
    type: String, 
    enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'], 
    default: 'pending' 
  },
  paymentMethod: String,
  amount: { type: Number, required: true },
  trackingNumber: String,
  shippingAddress: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: String
  },
  billingAddress: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: String
  },
  cancelledAt: Date
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);