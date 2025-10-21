// utils/jwtUtils.js
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
    console.error('❌ JWT_SECRET is not defined in environment variables');
    console.error('Please add JWT_SECRET to your .env file');
    process.exit(1);
}

const generateToken = (userId, email) => {
    return jwt.sign(
        { 
            userId: userId,
            email: email 
        }, 
        JWT_SECRET, 
        { expiresIn: '24h' }
    );
};

const verifyToken = (token) => {
    try {
        return jwt.verify(token, JWT_SECRET);
    } catch (error) {
        throw error;
    }
};

module.exports = {
    generateToken,
    verifyToken,
    JWT_SECRET
};