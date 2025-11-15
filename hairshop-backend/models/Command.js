const mongoose = require("mongoose");

const commandSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User", 
    required: true 
  },
  orderNumber: {
    type: String,
    unique: true,
    required: true
  },
  products: [{ 
    productId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "Product" 
    },
    name: String,
    price: { type: Number, required: true },
    quantity: { type: Number, required: true },
    purchaseType: { 
      type: String, 
      enum: ["retail", "bulk"], 
      default: "retail" 
    },
    bulkUnit: String
  }],
  totalAmount: { 
    type: Number, 
    required: true 
  },
  status: { 
    type: String, 
    enum: ["pending", "confirmed", "processing", "shipped", "delivered", "cancelled"], 
    default: "pending" 
  },
  paymentMethod: {
    type: String,
    default: "whatsapp"
  },
  shippingAddress: {
    name: String,
    phone: String,
    address: String,
    city: String,
    country: String
  },
  trackingNumber: String,
  notes: String,
  affectsRevenue: {
    type: Boolean,
    default: true
  },
  cancelledAt: Date
}, { 
  timestamps: true 
});

// Generate order number before saving
commandSchema.pre('save', function(next) {
  if (!this.orderNumber) {
    this.orderNumber = 'CMD' + Date.now() + Math.floor(Math.random() * 1000);
  }
  next();
});
commandSchema.methods.updateStatus = async function(newStatus) {
  const previousStatus = this.status;
  this.status = newStatus;
  
  if (newStatus === 'cancelled') {
    this.affectsRevenue = false;
    this.cancelledAt = new Date();
  } else if (previousStatus === 'cancelled' && newStatus !== 'cancelled') {
    this.affectsRevenue = true;
    this.cancelledAt = undefined;
  }
  
  await this.save();
  return this;
};

module.exports = mongoose.model("Command", commandSchema);