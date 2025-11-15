// controllers/adminController.js
const mongoose = require('mongoose');
const Command = require('../models/Command');
const User = require('../models/User');
const Product = require('../models/Product');

// Get admin statistics
exports.getAdminStats = async (req, res) => {
  try {
    const totalOrders = await Command.countDocuments();
    const totalUsers = await User.countDocuments();
    const totalProducts = await Product.countDocuments();
    
    // Calculate revenue from commands that affect revenue
    const revenueResult = await Command.aggregate([
      { $match: { affectsRevenue: true } },
      { $group: { _id: null, totalRevenue: { $sum: '$totalAmount' } } }
    ]);
    
    const totalRevenue = revenueResult.length > 0 ? revenueResult[0].totalRevenue : 0;

    res.json({
      success: true,
      stats: {
        totalOrders,
        totalUsers,
        totalProducts,
        totalRevenue
      }
    });
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Other admin functions can go here too
exports.getAdminProfile = async (req, res) => {
  try {
    const admin = await User.findById(req.user.userId).select('-password');
    res.json({ success: true, admin });
  } catch (error) {
    console.error('Error fetching admin profile:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};