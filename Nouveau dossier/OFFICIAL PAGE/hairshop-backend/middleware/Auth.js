// middleware/Auth.js
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { JWT_SECRET } = require('../utils/jwtUtils');

module.exports = async function(req, res, next) {
    try {
        const authHeader = req.headers.authorization;
        
        console.log('Auth middleware called');
        
        if (!authHeader) {
            return res.status(401).json({ 
                error: 'Access denied',
                message: 'No authorization token provided',
                code: 'NO_TOKEN' 
            });
        }

        const parts = authHeader.split(' ');
        if (parts.length !== 2 || parts[0] !== 'Bearer') {
            return res.status(401).json({ 
                error: 'Access denied',
                message: 'Invalid token format. Use: Bearer <token>',
                code: 'INVALID_FORMAT' 
            });
        }

        const token = parts[1];
        
        // Verify JWT token
        const decoded = jwt.verify(token, JWT_SECRET);
        
        /**
         * FIX: We ensure req.user has both 'id' and 'userId' 
         * to be compatible with your reportController.js
         */
        req.user = { 
            id: decoded.id || decoded.userId, 
            userId: decoded.userId || decoded.id,
            email: decoded.email,
            role: decoded.role 
        };

        // Automatic Admin check for admin routes
        if (req.originalUrl.startsWith('/api/admin') && req.user.role !== 'admin') {
            console.log('Admin access denied for user:', req.user.email);
            return res.status(403).json({ 
                error: 'Access denied',
                message: 'Administrator privileges required',
                code: 'ADMIN_REQUIRED'
            });
        }

        console.log('Auth middleware completed successfully for user:', req.user.userId);
        next();
    } catch (error) {
        console.error('Auth middleware error:', error);

        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ 
                error: 'Access denied', 
                message: 'Token has expired', 
                code: 'TOKEN_EXPIRED' 
            });
        }

        return res.status(401).json({ 
            error: 'Access denied', 
            message: 'Invalid token', 
            code: 'INVALID_TOKEN' 
        });
    }
};