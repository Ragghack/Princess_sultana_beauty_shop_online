const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: [true, 'Product name is required'] 
  },
  description: { 
    type: String, 
    required: [true, 'Product description is required'] 
  },
  price: { 
    type: Number, 
    required: [true, 'Product price is required'],
    min: [0, 'Price cannot be negative']
  },
  retailPrice: { 
    type: Number,
    min: [0, 'Retail price cannot be negative']
  },
  retailQuantity: { 
    type: Number, 
    default: 0,
    min: [0, 'Quantity cannot be negative']
  },
  category: { 
    type: String, 
    required: [true, 'Product category is required'] 
  },
  tag: { 
    type: String, 
    default: 'New' 
  },
  imageURL: { 
    type: String, 
    default: null
  },
  imageFile: { // For storing file upload data
    filename: String,
    originalName: String,
    path: String
  },
  status: { 
    type: String, 
    enum: ['active', 'inactive', 'out-of-stock'], 
    default: 'active' 
  },
  bulkQuantity: { type: Number, default: 0 },
  bulkUnit: { type: String }
}, { 
  timestamps: true 
});

module.exports = mongoose.model("Product", productSchema);