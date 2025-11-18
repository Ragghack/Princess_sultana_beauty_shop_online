// middleware/Auth.js
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { JWT_SECRET } = require('../utils/jwtUtils');

module.exports = async function(req, res, next) {
    try {
        const authHeader = req.headers.authorization;
        
        console.log('Auth middleware called');
        console.log('Authorization header:', authHeader ? 'Present' : 'Missing');
        
        if (!authHeader) {
            console.log('No authorization header found');
            return res.status(401).json({ 
                error: 'Access denied',
                message: 'No authorization token provided',
                code: 'NO_TOKEN'
            });
        }

        const parts = authHeader.split(' ');
        if (parts.length !== 2 || parts[0] !== 'Bearer') {
            console.log('Invalid token format');
            return res.status(401).json({ 
                error: 'Access denied',
                message: 'Invalid token format. Use: Bearer <token>',
                code: 'INVALID_FORMAT'
            });
        }

        const token = parts[1];
        
        console.log('Token received:', token ? 'Yes' : 'No');
        console.log('Token length:', token.length);
        
        // Verify JWT token
        const decoded = jwt.verify(token, JWT_SECRET);
        console.log('Token decoded successfully, user ID:', decoded.userId);
        
        // ✅ ADD VALIDATION FOR USER ID
        if (!decoded.userId) {
            console.log('User ID missing in token payload');
            return res.status(401).json({ 
                error: 'Access denied',
                message: 'Invalid token payload',
                code: 'INVALID_TOKEN_PAYLOAD'
            });
        }

        // Check if user exists in database
        const user = await User.findById(decoded.userId).select('-password');
        if (!user) {
            console.log('User not found in database:', decoded.userId);
            return res.status(401).json({ 
                error: 'Access denied',
                message: 'User account no longer exists',
                code: 'USER_NOT_FOUND'
            });
        }

        console.log('User found:', user.email);

        // ✅ FIX: Ensure consistent user ID format
        req.user = {
            userId: user._id.toString(), // ✅ Convert to string for consistency
            email: user.email,
            name: user.name,
            role: user.role
        };

        // Add this after setting req.user
        console.log('User role:', req.user.role);

        // For admin routes, check if user is admin
        if (req.originalUrl.startsWith('/api/admin') && req.user.role !== 'admin') {
            console.log('Admin access denied for user:', req.user.email);
            return res.status(403).json({ 
                error: 'Access denied',
                message: 'Administrator privileges required',
                code: 'ADMIN_REQUIRED'
            });
        }

        console.log('Auth middleware completed successfully');
        next();
    } catch (error) {
        console.error('Auth middleware error:', error);

        if (error.name === 'TokenExpiredError') {
            console.log('Token expired error');
            return res.status(401).json({ 
                error: 'Access denied',
                message: 'Token has expired',
                code: 'TOKEN_EXPIRED'
            });
        }

        if (error.name === 'JsonWebTokenError') {
            console.log('JWT error:', error.message);
            return res.status(401).json({ 
                error: 'Access denied',
                message: 'Invalid token',
                code: 'INVALID_TOKEN'
            });
        }

        console.log('Other auth error:', error.message);
        return res.status(500).json({ 
            error: 'Authentication error',
            message: 'Failed to authenticate user',
            code: 'AUTH_FAILED'
        });
    }
};

// 🚨 REMOVE THIS DUPLICATE EXPORT - IT'S OVERWRITING THE ONE ABOVE 🚨