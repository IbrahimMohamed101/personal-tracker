const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const databaseReady = require('../middleware/databaseReady');

function normalizeUsername(value) {
    return String(value || '').trim();
}

function normalizePassword(value) {
    return String(value || '');
}

function validateAuthPayload(username, password) {
    if (!username) return 'Username is required';
    if (username.length < 3) return 'Username must be at least 3 characters';
    if (username.length > 40) return 'Username must be 40 characters or fewer';
    if (!password) return 'Password is required';
    if (password.length < 6) return 'Password must be at least 6 characters';
    return null;
}

// Register
router.post('/register', databaseReady, async (req, res) => {
    try {
        const username = normalizeUsername(req.body && req.body.username);
        const password = normalizePassword(req.body && req.body.password);
        const validationError = validateAuthPayload(username, password);
        if (validationError) return res.status(400).json({ message: validationError });

        let user = await User.findOne({ username });
        if (user) return res.status(400).json({ message: 'User already exists' });

        user = new User({ username, password });
        await user.save();

        const token = jwt.sign({ id: user._id, username: user.username }, process.env.JWT_SECRET, { expiresIn: '7d' });
        res.status(201).json({ token, username: user.username });
    } catch (err) {
        console.error('Register failed:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Login
router.post('/login', databaseReady, async (req, res) => {
    try {
        const username = normalizeUsername(req.body && req.body.username);
        const password = normalizePassword(req.body && req.body.password);
        const validationError = validateAuthPayload(username, password);
        if (validationError) return res.status(400).json({ message: validationError });

        const user = await User.findOne({ username });
        if (!user || !(await user.comparePassword(password))) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        const token = jwt.sign({ id: user._id, username: user.username }, process.env.JWT_SECRET, { expiresIn: '7d' });
        res.json({ token, username: user.username });
    } catch (err) {
        console.error('Login failed:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
