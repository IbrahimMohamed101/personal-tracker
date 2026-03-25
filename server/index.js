const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
app.use(express.json({ limit: '50mb' }));
app.use(cors());

let isDatabaseReady = false;

app.get('/healthz', (_req, res) => {
    res.status(isDatabaseReady ? 200 : 503).json({ ok: isDatabaseReady });
});

app.use('/api/auth', require('./routes/auth'));
app.use('/api/data', require('./routes/data'));
app.use('/assets', express.static(path.join(__dirname, '..', 'assets')));

app.get('/', (_req, res) => {
    res.sendFile(path.join(__dirname, '..', 'index.html'));
});

app.get('/sama_os.html', (_req, res) => {
    res.sendFile(path.join(__dirname, '..', 'sama_os.html'));
});

function readMongoUri() {
    const rawValue = String(process.env.MONGODB_URI || '').trim();
    const unquotedValue = rawValue.replace(/^['"]|['"]$/g, '');
    return unquotedValue;
}

async function startServer() {
    const mongoUri = readMongoUri();
    if (!mongoUri) {
        console.error('Startup failed: MONGODB_URI is missing.');
        process.exit(1);
    }

    if (!/^mongodb(\+srv)?:\/\//.test(mongoUri)) {
        console.error('Startup failed: MONGODB_URI must start with "mongodb://" or "mongodb+srv://".');
        process.exit(1);
    }

    try {
        await mongoose.connect(mongoUri);
        isDatabaseReady = true;
        console.log('MongoDB Connected');
    } catch (err) {
        console.error('MongoDB Connection Error:', err);
        process.exit(1);
    }

    const PORT = process.env.PORT || 5000;
    const HOST = process.env.HOST || '0.0.0.0';
    app.listen(PORT, HOST, () => console.log(`Server running on http://${HOST}:${PORT}`));
}

startServer();
