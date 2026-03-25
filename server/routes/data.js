const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const databaseReady = require('../middleware/databaseReady');
const TrackerData = require('../models/TrackerData');

// GET State
router.get('/state', databaseReady, auth, async (req, res) => {
    try {
        let state = await TrackerData.findOne({ userId: req.user.id });
        if (!state) {
            // Return null or default if not found
            return res.json(null);
        }
        res.json(state);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

// POST/PUT State (Sync)
router.post('/state', databaseReady, auth, async (req, res) => {
    try {
        const data = req.body;
        let state = await TrackerData.findOne({ userId: req.user.id });
        
        if (state) {
            // Update existing
            Object.assign(state, data);
            state.updatedAt = Date.now();
            await state.save();
        } else {
            // Create new
            state = new TrackerData({
                userId: req.user.id,
                ...data
            });
            await state.save();
        }
        res.json(state);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
