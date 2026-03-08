/**
 * server.js
 * Entry point for the QuizApp backend.
 * Loads env vars ➜ connects to MongoDB ➜ mounts routes ➜ starts HTTP server.
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const app = require('./app');
const connectDB = require('./config/db');

const PORT = process.env.PORT || 5000;

// Connect to MongoDB, then start listening
connectDB().then(() => {
    app.listen(PORT, () => {
        console.log(`[server] running on port ${PORT} (${process.env.NODE_ENV})`);
    });
});
