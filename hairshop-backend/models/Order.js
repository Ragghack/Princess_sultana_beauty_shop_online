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
  affectsRevenue: {
    type: Boolean,
    default: true
  },
  cancelledAt: Date
}, { timestamps: true });

// Add the updateStatus method AFTER the schema is defined
orderSchema.methods.updateStatus = async function(newStatus) {
  const previousStatus = this.status;
  this.status = newStatus;
  
  // Update affectsRevenue based on status
  if (newStatus === 'cancelled') {
    this.affectsRevenue = false;
    this.cancelledAt = new Date();
  } else if (previousStatus === 'cancelled' && newStatus !== 'cancelled') {
    // If uncancelling an order, it should affect revenue again
    this.affectsRevenue = true;
    this.cancelledAt = undefined;
  }
  
  await this.save();
  return this;
};

module.exports = mongoose.model('Order', orderSchema);