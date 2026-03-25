const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
app.use(express.json({ limit: '50mb' }));
app.use(cors());

app.get('/healthz', (_req, res) => {
    res.status(200).json({ ok: true });
});

mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('MongoDB Connected'))
    .catch(err => console.error('MongoDB Connection Error:', err));

app.use('/api/auth', require('./routes/auth'));
app.use('/api/data', require('./routes/data'));
app.use('/assets', express.static(path.join(__dirname, '..', 'assets')));

app.get('/', (_req, res) => {
    res.sendFile(path.join(__dirname, '..', 'index.html'));
});

app.get('/sama_os.html', (_req, res) => {
    res.sendFile(path.join(__dirname, '..', 'sama_os.html'));
});

const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || '0.0.0.0';
app.listen(PORT, HOST, () => console.log(`Server running on http://${HOST}:${PORT}`));
