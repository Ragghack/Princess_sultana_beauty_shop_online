const express = require('express');
const router = express.Router();
const User = require('../models/User'); 
const auth = require('../middleware/Auth');

router.use(auth);

router.get('/', async (req, res) => {
    try {
        const customers = await User.find({ role: 'customer' }).select('-password');
        res.json(customers);
    } catch (error) {
        res.status(500).json({ error: 'Server error', message: error.message });
    }
});

module.exports = router;