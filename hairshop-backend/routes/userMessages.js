// routes/userMessages.js
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Message = require('../models/Message');

// Send a message to admin
router.post('/messages', auth, async (req, res) => {
    try {
        const { type, priority, subject, content, orderId } = req.body;

        // Validate required fields
        if (!type || !priority || !subject || !content) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: type, priority, subject, content'
            });
        }

        const message = new Message({
            userId: req.user.id,
            type,
            priority,
            subject,
            content,
            orderId: orderId || null,
            status: 'pending'
        });

        await message.save();

        res.status(201).json({
            success: true,
            message: 'Message sent successfully',
            data: message
        });

    } catch (error) {
        console.error('Error sending message:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to send message'
        });
    }
});

// Get user's messages
router.get('/messages', auth, async (req, res) => {
    try {
        const messages = await Message.find({ userId: req.user.id })
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            messages
        });

    } catch (error) {
        console.error('Error fetching messages:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch messages'
        });
    }
});

module.exports = router;