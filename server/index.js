const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env'), quiet: true });
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
app.use(express.json({ limit: '50mb' }));
app.use(cors());

let isDatabaseReady = false;

app.get('/healthz', (_req, res) => {
    res.status(isDatabaseReady ? 200 : 503).json({
        ok: isDatabaseReady,
        databaseReady: isDatabaseReady,
        readyState: mongoose.connection.readyState,
    });
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

function readEnvValue(name) {
    const rawValue = String(process.env[name] || '').trim();
    const unquotedValue = rawValue.replace(/^['"]|['"]$/g, '').trim();
    const assignmentPattern = new RegExp(`^${name}\\s*=\\s*`, 'i');
    return unquotedValue.replace(assignmentPattern, '').trim();
}

async function startServer() {
    const mongoUri = readEnvValue('MONGODB_URI');
    const jwtSecret = readEnvValue('JWT_SECRET');

    process.env.MONGODB_URI = mongoUri;
    process.env.JWT_SECRET = jwtSecret;

    if (!mongoUri) {
        console.error('Startup failed: MONGODB_URI is missing.');
        process.exit(1);
    }

    if (!/^mongodb(\+srv)?:\/\//.test(mongoUri)) {
        console.error('Startup failed: MONGODB_URI must start with "mongodb://" or "mongodb+srv://".');
        process.exit(1);
    }

    if (!jwtSecret) {
        console.error('Startup failed: JWT_SECRET is missing.');
        process.exit(1);
    }

    mongoose.connection.on('connected', () => {
        isDatabaseReady = true;
    });

    mongoose.connection.on('disconnected', () => {
        isDatabaseReady = false;
        console.error('MongoDB disconnected.');
    });

    mongoose.connection.on('error', (error) => {
        isDatabaseReady = false;
        console.error('MongoDB runtime error:', error);
    });

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
