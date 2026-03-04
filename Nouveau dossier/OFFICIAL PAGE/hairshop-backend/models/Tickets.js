const mongoose = require('mongoose');
const ticketSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  subject: String,
  priority: String,
  message: String,
  status: { type: String, default: 'open' },
  orderId: String,
  adminResponse: String
}, { timestamps: true });
module.exports = mongoose.model('Ticket', ticketSchema);
