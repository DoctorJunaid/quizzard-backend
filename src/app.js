/**
 * app.js
 * Creates and configures the Express application.
 * Keeps server.js clean – all middleware & route wiring lives here.
 *
 * IMPORTANT (Vercel serverless): connectDB() is called as middleware on every
 * request. On a warm container it returns immediately (cached connection).
 * On a cold start it establishes the connection before any route runs.
 * This prevents the "buffering timed out" error caused by missing DB connections.
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const connectDB = require('./config/db');
const apiRoutes = require('./routes'); // Automatically imports index.js

const app = express();

// ── Global Middleware ───────────────────────────────────────────────────────
app.use(cookieParser());

// Allow requests from the React dev server (or production domain)
app.use(cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
}));

// Parse incoming JSON bodies
app.use(express.json());

// ── Serverless DB connection middleware ─────────────────────────────────────
// Must run BEFORE any route that touches the database.
// On warm Vercel containers this is instant (returns cached connection).
// On cold starts it awaits the MongoDB handshake before proceeding.
app.use(async (_req, _res, next) => {
    try {
        await connectDB();
        next();
    } catch (err) {
        console.error('[app] DB connection error in middleware:', err.message);
        next(err); // Let the global error handler return a 500
    }
});

// ── Health check ────────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── API Routes ──────────────────────────────────────────────────────────────
// All sub-routes (auth, users, quizzes, etc.) are managed in /routes/index.js
app.use('/api', apiRoutes);

// ── 404 handler (unknown routes) ────────────────────────────────────────────
app.use((_req, res) => {
    res.status(404).json({ message: 'Route not found.' });
});

// ── Global error handler ────────────────────────────────────────────────────
// Must have 4 params so Express recognises it as an error handler
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
    console.error('[error]', err.message);
    res.status(err.status || 500).json({
        message: err.message || 'Internal server error.',
    });
});

module.exports = app;
