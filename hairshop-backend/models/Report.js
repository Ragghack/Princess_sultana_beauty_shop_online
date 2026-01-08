const mongoose = require('mongoose');

const ReportSchema = new mongoose.Schema({
    reportType: {
        type: String,
        enum: ['sales', 'customers', 'products', 'inventory', 'financial'],
        required: true
    },
    period: {
        type: String,
        enum: ['daily', 'weekly', 'monthly', 'quarterly', 'yearly', 'custom'],
        required: true
    },
    startDate: {
        type: Date,
        required: true
    },
    endDate: {
        type: Date,
        required: true
    },
    generatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    data: {
        type: mongoose.Schema.Types.Mixed,
        required: true
    },
    summary: {
        totalRevenue: { type: Number, default: 0 },
        totalOrders: { type: Number, default: 0 },
        totalCustomers: { type: Number, default: 0 },
        averageOrderValue: { type: Number, default: 0 },
        topProducts: [{ 
            productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
            name: String,
            quantity: Number,
            revenue: Number
        }],
        orderStatusDistribution: {
            pending: { type: Number, default: 0 },
            processing: { type: Number, default: 0 },
            shipped: { type: Number, default: 0 },
            delivered: { type: Number, default: 0 },
            cancelled: { type: Number, default: 0 }
        }
    },
    filePath: {
        type: String
    },
    isArchived: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Report', ReportSchema);