const mongoose = require('mongoose');

module.exports = (_req, res, next) => {
    if (mongoose.connection.readyState !== 1) {
        return res.status(503).json({ message: 'Database connection unavailable' });
    }

    next();
};
