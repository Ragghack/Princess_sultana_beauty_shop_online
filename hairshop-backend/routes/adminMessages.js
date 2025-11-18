// routes/adminMessages.js
const express = require('express');
const router = express.Router();
const auth = require('../middleware/Auth');
//const Auth = require('../middleware/Auth');
const Message = require('../models/Message');

// Get all messages (admin)
router.get('/messages', auth, async (req, res) => {
    try {
        const { status, type, page = 1, limit = 20 } = req.query;
        
        let filter = {};
        if (status) filter.status = status;
        if (type) filter.type = type;

        const messages = await Message.find(filter)
            .populate('userId', 'name email')
            .populate('orderId', 'orderNumber')
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const total = await Message.countDocuments(filter);

        res.json({
            success: true,
            messages,
            totalPages: Math.ceil(total / limit),
            currentPage: page
        });

    } catch (error) {
        console.error('Error fetching messages:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch messages'
        });
    }
});

// Reply to message (admin)
router.post('/messages/:id/reply', auth, async (req, res) => {
    try {
        const { reply } = req.body;

        if (!reply) {
            return res.status(400).json({
                success: false,
                error: 'Reply content is required'
            });
        }

        const message = await Message.findByIdAndUpdate(
            req.params.id,
            {
                adminReply: reply,
                repliedAt: new Date(),
                status: 'answered'
            },
            { new: true }
        ).populate('userId', 'name email');

        if (!message) {
            return res.status(404).json({
                success: false,
                error: 'Message not found'
            });
        }

        res.json({
            success: true,
            message: 'Reply sent successfully',
            data: message
        });

    } catch (error) {
        console.error('Error replying to message:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to send reply'
        });
    }
});

module.exports = router;