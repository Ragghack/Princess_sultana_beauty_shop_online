// models/Message.js
const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    type: {
        type: String,
        enum: ['general', 'order', 'product', 'complaint'],
        required: true
    },
    priority: {
        type: String,
        enum: ['low', 'medium', 'high'],
        required: true
    },
    subject: {
        type: String,
        required: true,
        trim: true
    },
    content: {
        type: String,
        required: true,
        trim: true
    },
    orderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order',
        default: null
    },
    status: {
        type: String,
        enum: ['pending', 'answered', 'resolved'],
        default: 'pending'
    },
    adminReply: {
        type: String,
        default: null
    },
    repliedAt: {
        type: Date,
        default: null
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Message', messageSchema);