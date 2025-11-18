// routes/user.js - COMPLETE USER ROUTES
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Order = require('../models/Order');
const Product = require('../models/Product');
const auth = require('../middleware/Auth');
const { generateToken } = require('../utils/jwtUtils');

// ============================
// 👤 USER PROFILE ROUTES
// ============================

// @route   GET /api/user/profile
// @desc    Get current user profile
// @access  Private
router.get('/profile', auth, async (req, res) => {
    try {
        console.log('🔍 Fetching user profile for:', req.user.userId);
        
        const user = await User.findById(req.user.userId).select('-password');
        
        if (!user) {
            console.log('❌ User not found:', req.user.userId);
            return res.status(404).json({ 
                success: false,
                error: 'User not found' 
            });
        }

        console.log('✅ User profile found:', user.email);
        
        res.json({
            success: true,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                phone: user.phone || '',
                address: user.address || '',
                createdAt: user.createdAt,
                updatedAt: user.updatedAt
            }
        });

    } catch (error) {
        console.error('💥 Get profile error:', error);
        res.status(500).json({ 
            success: false,
            error: 'Server error while fetching user data' 
        });
    }
});

// @route   PUT /api/user/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', auth, async (req, res) => {
    try {
        console.log('📝 Updating profile for user:', req.user.userId);
        console.log('Update data:', req.body);
        
        const { name, email, phone, address } = req.body;
        
        // Validation
        if (!name || !email) {
            return res.status(400).json({ 
                success: false,
                error: 'Name and email are required' 
            });
        }

        // Check if email is already taken by another user
        const existingUser = await User.findOne({ 
            email: email.toLowerCase().trim(), 
            _id: { $ne: req.user.userId } 
        });
        
        if (existingUser) {
            console.log('❌ Email already taken:', email);
            return res.status(400).json({ 
                success: false,
                error: 'Email is already taken by another user' 
            });
        }

        // Update user
        const updatedUser = await User.findByIdAndUpdate(
            req.user.userId,
            { 
                name: name.trim(),
                email: email.toLowerCase().trim(),
                phone: phone || '',
                address: address || ''
            },
            { new: true, runValidators: true }
        ).select('-password');

        if (!updatedUser) {
            return res.status(404).json({ 
                success: false,
                error: 'User not found' 
            });
        }

        console.log('✅ Profile updated successfully for:', updatedUser.email);
        
        res.json({
            success: true,
            message: 'Profile updated successfully',
            user: {
                id: updatedUser._id,
                name: updatedUser.name,
                email: updatedUser.email,
                role: updatedUser.role,
                phone: updatedUser.phone,
                address: updatedUser.address,
                createdAt: updatedUser.createdAt,
                updatedAt: updatedUser.updatedAt
            }
        });

    } catch (error) {
        console.error('💥 Update profile error:', error);
        
        if (error.name === 'ValidationError') {
            const errors = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({ 
                success: false,
                error: errors.join(', ') 
            });
        }
        
        res.status(500).json({ 
            success: false,
            error: 'Server error while updating profile' 
        });
    }
});

// ============================
// 📊 USER DASHBOARD ROUTES
// ============================

// @route   GET /api/user/dashboard
// @desc    Get user dashboard data
// @access  Private
router.get('/dashboard', auth, async (req, res) => {
    try {
        console.log('📊 Fetching dashboard data for user:', req.user.userId);
        
        const user = await User.findById(req.user.userId).select('-password');
        
        if (!user) {
            return res.status(404).json({ 
                success: false,
                error: 'User not found' 
            });
        }

        // Get order statistics
        const totalOrders = await Order.countDocuments({ user: req.user.userId });
        const completedOrders = await Order.countDocuments({ 
            user: req.user.userId, 
            status: 'completed' 
        });
        const pendingOrders = await Order.countDocuments({ 
            user: req.user.userId, 
            status: 'pending' 
        });
        const processingOrders = await Order.countDocuments({ 
            user: req.user.userId, 
            status: 'processing' 
        });

        // Calculate loyalty points (50 points per completed order)
        const loyaltyPoints = completedOrders * 50;

        // Get recent orders (last 5)
        const recentOrders = await Order.find({ user: req.user.userId })
            .sort({ createdAt: -1 })
            .limit(5)
            .populate('items.product', 'name price images')
            .lean();

        // Format recent orders
        const formattedRecentOrders = recentOrders.map(order => ({
            id: order._id,
            orderNumber: `HC-${order._id.toString().slice(-6).toUpperCase()}`,
            createdAt: order.createdAt,
            updatedAt: order.updatedAt,
            status: order.status,
            amount: order.amount || 0,
            items: order.items.map(item => ({
                name: item.product?.name || 'Product',
                quantity: item.qty,
                price: item.price,
                image: item.product?.images?.[0] || '/uploads/default-product.jpg'
            })),
            itemCount: order.items.reduce((total, item) => total + item.qty, 0)
        }));

        console.log('✅ Dashboard data loaded for:', user.email);
        
        res.json({
            success: true,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            },
            stats: {
                totalOrders,
                completed: completedOrders,
                pending: pendingOrders,
                processing: processingOrders,
                loyaltyPoints
            },
            recentOrders: formattedRecentOrders
        });

    } catch (error) {
        console.error('💥 Dashboard error:', error);
        res.status(500).json({ 
            success: false,
            error: 'Server error while fetching dashboard data' 
        });
    }
});

// ============================
// 📦 ORDER MANAGEMENT ROUTES
// ============================

// @route   GET /api/user/orders
// @desc    Get all orders for current user
// @access  Private
router.get('/orders', auth, async (req, res) => {
    try {
        console.log('📦 Fetching orders for user:', req.user.userId);
        
        const { status, page = 1, limit = 10 } = req.query;
        
        // Build filter
        const filter = { user: req.user.userId };
        if (status && status !== 'all') {
            filter.status = status;
        }

        // Calculate pagination
        const skip = (parseInt(page) - 1) * parseInt(limit);
        
        // Get orders with pagination
        const orders = await Order.find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit))
            .populate('items.product', 'name price images')
            .lean();

        // Get total count for pagination
        const totalOrders = await Order.countDocuments(filter);
        const totalPages = Math.ceil(totalOrders / parseInt(limit));

        // Format orders
        const formattedOrders = orders.map(order => ({
            _id: order._id,
            orderNumber: `HC-${order._id.toString().slice(-6).toUpperCase()}`,
            createdAt: order.createdAt,
            updatedAt: order.updatedAt,
            status: order.status,
            amount: order.amount || 0,
            paymentMethod: order.paymentMethod || 'Not specified',
            trackingNumber: order.trackingNumber || null,
            items: order.items.map(item => ({
                product: {
                    id: item.product?._id,
                    name: item.product?.name || 'Product',
                    price: item.product?.price || 0,
                    image: item.product?.images?.[0] || '/uploads/default-product.jpg'
                },
                quantity: item.qty,
                price: item.price
            })),
            shippingAddress: order.shippingAddress || {},
            billingAddress: order.billingAddress || {}
        }));

        console.log(`✅ Found ${orders.length} orders for user:`, req.user.userId);
        
        res.json({
            success: true,
            orders: formattedOrders,
            pagination: {
                currentPage: parseInt(page),
                totalPages,
                totalOrders,
                hasNext: parseInt(page) < totalPages,
                hasPrev: parseInt(page) > 1
            }
        });

    } catch (error) {
        console.error('💥 Get orders error:', error);
        res.status(500).json({ 
            success: false,
            error: 'Server error while fetching orders' 
        });
    }
});

// @route   GET /api/user/orders/:id
// @desc    Get single order details
// @access  Private
router.get('/orders/:id', auth, async (req, res) => {
    try {
        console.log('📋 Fetching order details:', req.params.id);
        
        const order = await Order.findOne({ 
            _id: req.params.id, 
            user: req.user.userId 
        })
        .populate('items.product', 'name price images description')
        .populate('user', 'name email phone')
        .lean();

        if (!order) {
            console.log('❌ Order not found:', req.params.id);
            return res.status(404).json({ 
                success: false,
                error: 'Order not found' 
            });
        }

        // Format order details
        const orderDetails = {
            _id: order._id,
            orderNumber: `HC-${order._id.toString().slice(-6).toUpperCase()}`,
            createdAt: order.createdAt,
            updatedAt: order.updatedAt,
            status: order.status,
            amount: order.amount || 0,
            paymentMethod: order.paymentMethod || 'Not specified',
            trackingNumber: order.trackingNumber || null,
            shippingAddress: order.shippingAddress || {},
            billingAddress: order.billingAddress || {},
            items: order.items.map(item => ({
                product: {
                    id: item.product?._id,
                    name: item.product?.name || 'Product',
                    description: item.product?.description || '',
                    price: item.product?.price || 0,
                    image: item.product?.images?.[0] || '/uploads/default-product.jpg'
                },
                quantity: item.qty,
                price: item.price,
                subtotal: item.qty * item.price
            })),
            user: {
                name: order.user?.name,
                email: order.user?.email,
                phone: order.user?.phone
            }
        };

        // Calculate totals
        orderDetails.subtotal = orderDetails.items.reduce((sum, item) => sum + item.subtotal, 0);
        orderDetails.shipping = orderDetails.amount - orderDetails.subtotal;

        console.log('✅ Order details loaded:', orderDetails.orderNumber);
        
        res.json({
            success: true,
            order: orderDetails
        });

    } catch (error) {
        console.error('💥 Get order details error:', error);
        res.status(500).json({ 
            success: false,
            error: 'Server error while fetching order details' 
        });
    }
});

// @route   POST /api/user/orders/:id/cancel
// @desc    Cancel an order
// @access  Private
router.post('/orders/:id/cancel', auth, async (req, res) => {
    try {
        console.log('❌ Cancelling order:', req.params.id);
        
        const order = await Order.findOne({ 
            _id: req.params.id, 
            user: req.user.userId 
        });

        if (!order) {
            return res.status(404).json({ 
                success: false,
                error: 'Order not found' 
            });
        }

        // Check if order can be cancelled
        if (!['pending', 'processing'].includes(order.status)) {
            return res.status(400).json({ 
                success: false,
                error: `Order cannot be cancelled because it is already ${order.status}` 
            });
        }

        // Update order status
        order.status = 'cancelled';
        order.cancelledAt = new Date();
        await order.save();

        console.log('✅ Order cancelled successfully:', order._id);
        
        res.json({
            success: true,
            message: 'Order cancelled successfully',
            order: {
                id: order._id,
                orderNumber: `HC-${order._id.toString().slice(-6).toUpperCase()}`,
                status: order.status,
                cancelledAt: order.cancelledAt
            }
        });

    } catch (error) {
        console.error('💥 Cancel order error:', error);
        res.status(500).json({ 
            success: false,
            error: 'Server error while cancelling order' 
        });
    }
});

// @route   POST /api/user/orders/:id/track
// @desc    Get order tracking information
// @access  Private
router.post('/orders/:id/track', auth, async (req, res) => {
    try {
        console.log('🚚 Tracking order:', req.params.id);
        
        const order = await Order.findOne({ 
            _id: req.params.id, 
            user: req.user.userId 
        }).select('status trackingNumber');

        if (!order) {
            return res.status(404).json({ 
                success: false,
                error: 'Order not found' 
            });
        }

        // Mock tracking data - in real app, integrate with shipping provider
        const trackingInfo = {
            orderNumber: `HC-${order._id.toString().slice(-6).toUpperCase()}`,
            trackingNumber: order.trackingNumber || 'Not available yet',
            status: order.status,
            estimatedDelivery: order.status === 'shipped' ? 
                new Date(Date.now() + 5 * 24 * 60 * 60 * 1000) : null, // 5 days from now
            trackingHistory: generateMockTrackingHistory(order.status)
        };

        console.log('✅ Tracking info provided for:', order._id);
        
        res.json({
            success: true,
            tracking: trackingInfo
        });

    } catch (error) {
        console.error('💥 Track order error:', error);
        res.status(500).json({ 
            success: false,
            error: 'Server error while fetching tracking information' 
        });
    }
});

// ============================
// 💳 PAYMENT METHODS ROUTES
// ============================

// @route   GET /api/user/payments
// @desc    Get user's payment methods
// @access  Private
router.get('/payments', auth, async (req, res) => {
    try {
        console.log('💳 Fetching payment methods for user:', req.user.userId);
        
        // In a real application, this would fetch from a PaymentMethod model
        // For now, return mock data or empty array
        const mockPayments = [
            {
                _id: 'pm_1',
                type: 'visa',
                last4: '4242',
                expiry: '12/25',
                isDefault: true,
                createdAt: new Date('2023-01-15')
            },
            {
                _id: 'pm_2',
                type: 'mastercard',
                last4: '8888',
                expiry: '08/24',
                isDefault: false,
                createdAt: new Date('2023-06-20')
            }
        ];

        console.log('✅ Payment methods loaded for user:', req.user.userId);
        
        res.json({
            success: true,
            payments: mockPayments
        });

    } catch (error) {
        console.error('💥 Get payments error:', error);
        res.status(500).json({ 
            success: false,
            error: 'Server error while fetching payment methods' 
        });
    }
});

// @route   POST /api/user/payments
// @desc    Add new payment method
// @access  Private
router.post('/payments', auth, async (req, res) => {
    try {
        console.log('➕ Adding payment method for user:', req.user.userId);
        console.log('Payment data:', req.body);
        
        const { type, cardNumber, expiry, cvv, nameOnCard, isDefault } = req.body;
        
        // Validation
        if (!type || !cardNumber || !expiry || !cvv || !nameOnCard) {
            return res.status(400).json({ 
                success: false,
                error: 'All payment fields are required' 
            });
        }

        // In a real application, this would:
        // 1. Validate card details
        // 2. Tokenize with payment processor (Stripe, etc.)
        // 3. Save to PaymentMethod model
        
        // Mock response for now
        const newPayment = {
            _id: 'pm_' + Date.now(),
            type: type.toLowerCase(),
            last4: cardNumber.slice(-4),
            expiry: expiry,
            nameOnCard: nameOnCard,
            isDefault: isDefault || false,
            createdAt: new Date()
        };

        console.log('✅ Payment method added successfully');
        
        res.status(201).json({
            success: true,
            message: 'Payment method added successfully',
            payment: newPayment
        });

    } catch (error) {
        console.error('💥 Add payment error:', error);
        res.status(500).json({ 
            success: false,
            error: 'Server error while adding payment method' 
        });
    }
});

// @route   DELETE /api/user/payments/:id
// @desc    Remove payment method
// @access  Private
router.delete('/payments/:id', auth, async (req, res) => {
    try {
        console.log('🗑️ Removing payment method:', req.params.id);
        
        // In a real application, this would:
        // 1. Find payment method in database
        // 2. Delete from payment processor
        // 3. Remove from PaymentMethod model
        
        // Mock success response for now
        console.log('✅ Payment method removed successfully');
        
        res.json({
            success: true,
            message: 'Payment method removed successfully',
            deletedId: req.params.id
        });

    } catch (error) {
        console.error('💥 Remove payment error:', error);
        res.status(500).json({ 
            success: false,
            error: 'Server error while removing payment method' 
        });
    }
});

// @route   PUT /api/user/payments/:id/default
// @desc    Set payment method as default
// @access  Private
router.put('/payments/:id/default', auth, async (req, res) => {
    try {
        console.log('⭐ Setting default payment method:', req.params.id);
        
        // In a real application, this would update the PaymentMethod model
        
        console.log('✅ Default payment method updated');
        
        res.json({
            success: true,
            message: 'Default payment method updated successfully',
            paymentId: req.params.id
        });

    } catch (error) {
        console.error('💥 Set default payment error:', error);
        res.status(500).json({ 
            success: false,
            error: 'Server error while setting default payment method' 
        });
    }
});

// ============================
// 🔐 PASSWORD MANAGEMENT
// ============================

// @route   PUT /api/user/password
// @desc    Change user password
// @access  Private
router.put('/password', auth, async (req, res) => {
    try {
        console.log('🔐 Changing password for user:', req.user.userId);
        
        const { currentPassword, newPassword } = req.body;

        // Validation
        if (!currentPassword || !newPassword) {
            return res.status(400).json({ 
                success: false,
                error: 'Please enter both current and new password' 
            });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({ 
                success: false,
                error: 'New password must be at least 6 characters long' 
            });
        }

        // Get user with password
        const user = await User.findById(req.user.userId);
        
        // Verify current password
        const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
        if (!isCurrentPasswordValid) {
            console.log('❌ Current password is incorrect');
            return res.status(400).json({ 
                success: false,
                error: 'Current password is incorrect' 
            });
        }

        // Hash new password
        const salt = await bcrypt.genSalt(10);
        const hashedNewPassword = await bcrypt.hash(newPassword, salt);

        // Update password
        user.password = hashedNewPassword;
        await user.save();

        console.log('✅ Password updated successfully for:', user.email);
        
        res.json({ 
            success: true,
            message: 'Password updated successfully' 
        });

    } catch (error) {
        console.error('💥 Change password error:', error);
        res.status(500).json({ 
            success: false,
            error: 'Server error while changing password' 
        });
    }
});

// ============================
// 🎯 UTILITY FUNCTIONS
// ============================

// Helper function to generate mock tracking history
function generateMockTrackingHistory(status) {
    const baseHistory = [
        {
            status: 'Order Placed',
            description: 'Your order has been received',
            date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
            location: 'Online Store'
        },
        {
            status: 'Order Confirmed',
            description: 'We are preparing your order',
            date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
            location: 'Warehouse'
        }
    ];

    if (status === 'processing') {
        baseHistory.push({
            status: 'Processing',
            description: 'Your order is being processed',
            date: new Date(Date.now() - 12 * 60 * 60 * 1000), // 12 hours ago
            location: 'Warehouse'
        });
    } else if (status === 'shipped') {
        baseHistory.push(
            {
                status: 'Processing',
                description: 'Your order is being processed',
                date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
                location: 'Warehouse'
            },
            {
                status: 'Shipped',
                description: 'Your order has been shipped',
                date: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
                location: 'Shipping Partner'
            }
        );
    } else if (status === 'delivered') {
        baseHistory.push(
            {
                status: 'Processing',
                description: 'Your order is being processed',
                date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
                location: 'Warehouse'
            },
            {
                status: 'Shipped',
                description: 'Your order has been shipped',
                date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
                location: 'Shipping Partner'
            },
            {
                status: 'Out for Delivery',
                description: 'Your order is out for delivery',
                date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
                location: 'Local Facility'
            },
            {
                status: 'Delivered',
                description: 'Your order has been delivered',
                date: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
                location: 'Your Address'
            }
        );
    }

    return baseHistory;
}

// @route   GET /api/user/validate
// @desc    Validate token and get user data
// @access  Private
router.get('/validate', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.userId).select('-password');
        
        res.json({
            valid: true,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });

    } catch (error) {
        console.error('Token validation error:', error);
        res.status(401).json({ 
            valid: false,
            error: 'Invalid token' 
        });
    }
});

module.exports = router;