/**
 * app.js
 * Creates and configures the Express application.
 * Keeps server.js clean – all middleware & route wiring lives here.
 */

const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
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
