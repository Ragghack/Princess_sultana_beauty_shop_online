// routes/user.js
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const auth = require('../middleware/auth');
const { generateToken } = require('../utils/jwtUtils');

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post('/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;

        // Validation
        if (!name || !email || !password) {
            return res.status(400).json({ 
                error: 'Please enter all required fields' 
            });
        }

        if (password.length < 6) {
            return res.status(400).json({ 
                error: 'Password must be at least 6 characters long' 
            });
        }

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ 
                error: 'User already exists with this email' 
            });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create new user
        const newUser = new User({
            name,
            email,
            password: hashedPassword
        });

        // Save user to database
        const savedUser = await newUser.save();

        // Create token using the utility function
        const token = generateToken(savedUser._id, savedUser.email);

        // Return user data and token
        res.status(201).json({
            token,
            user: {
                id: savedUser._id,
                name: savedUser.name,
                email: savedUser.email,
                role: savedUser.role
            },
            message: 'User registered successfully'
        });

    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ 
            error: 'Server error during registration' 
        });
    }
});

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validation
        if (!email || !password) {
            return res.status(400).json({ 
                error: 'Please enter both email and password' 
            });
        }

        // Check if user exists
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ 
                error: 'Invalid email or password' 
            });
        }

        // Check password
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(400).json({ 
                error: 'Invalid email or password' 
            });
        }

        // Create token using the utility function
        const token = generateToken(user._id, user.email);

        // Return user data and token
        res.json({
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            },
            message: 'Login successful'
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ 
            error: 'Server error during login' 
        });
    }
});

// @route   GET /api/auth/me
// @desc    Get current user data
// @access  Private
router.get('/me', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.userId).select('-password');
        
        if (!user) {
            return res.status(404).json({ 
                error: 'User not found' 
            });
        }

        res.json({
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                createdAt: user.createdAt
            }
        });

    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({ 
            error: 'Server error while fetching user data' 
        });
    }
});

// @route   PUT /api/auth/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', auth, async (req, res) => {
    try {
        const { name, email } = req.body;
        
        // Validation
        if (!name || !email) {
            return res.status(400).json({ 
                error: 'Please enter all required fields' 
            });
        }

        // Check if email is already taken by another user
        const existingUser = await User.findOne({ 
            email, 
            _id: { $ne: req.user.userId } 
        });
        
        if (existingUser) {
            return res.status(400).json({ 
                error: 'Email is already taken by another user' 
            });
        }

        // Update user
        const updatedUser = await User.findByIdAndUpdate(
            req.user.userId,
            { name, email },
            { new: true }
        ).select('-password');

        res.json({
            user: updatedUser,
            message: 'Profile updated successfully'
        });

    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ 
            error: 'Server error while updating profile' 
        });
    }
});

// @route   PUT /api/auth/password
// @desc    Change user password
// @access  Private
router.put('/password', auth, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        // Validation
        if (!currentPassword || !newPassword) {
            return res.status(400).json({ 
                error: 'Please enter both current and new password' 
            });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({ 
                error: 'New password must be at least 6 characters long' 
            });
        }

        // Get user
        const user = await User.findById(req.user.userId);
        
        // Verify current password
        const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
        if (!isCurrentPasswordValid) {
            return res.status(400).json({ 
                error: 'Current password is incorrect' 
            });
        }

        // Hash new password
        const salt = await bcrypt.genSalt(10);
        const hashedNewPassword = await bcrypt.hash(newPassword, salt);

        // Update password
        user.password = hashedNewPassword;
        await user.save();

        res.json({ 
            message: 'Password updated successfully' 
        });

    } catch (error) {
        console.error('Change password error:', error);
        res.status(500).json({ 
            error: 'Server error while changing password' 
        });
    }
});

// @route   GET /api/auth/validate
// @desc    Validate token
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