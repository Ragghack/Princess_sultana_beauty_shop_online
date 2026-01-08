const mongoose = require('mongoose');

const CustomerAnalyticsSchema = new mongoose.Schema({
    customerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    customerName: {
        type: String,
        required: true
    },
    customerEmail: {
        type: String,
        required: true
    },
    totalOrders: {
        type: Number,
        default: 0
    },
    totalSpent: {
        type: Number,
        default: 0
    },
    averageOrderValue: {
        type: Number,
        default: 0
    },
    firstOrderDate: {
        type: Date
    },
    lastOrderDate: {
        type: Date
    },
    favoriteCategory: {
        type: String
    },
    orderFrequency: {
        type: Number, // orders per month
        default: 0
    },
    customerLifetimeValue: {
        type: Number,
        default: 0
    },
    retentionScore: {
        type: Number,
        min: 0,
        max: 100,
        default: 50
    }
}, {
    timestamps: true
});

// Index for faster queries
CustomerAnalyticsSchema.index({ customerId: 1 });
CustomerAnalyticsSchema.index({ totalSpent: -1 });
CustomerAnalyticsSchema.index({ lastOrderDate: -1 });

module.exports = mongoose.model('CustomerAnalytics', CustomerAnalyticsSchema);