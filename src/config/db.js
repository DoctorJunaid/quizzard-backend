/**
 * config/db.js
 *
 * Serverless-compatible MongoDB connection with caching.
 *
 * Problem: On Vercel (serverless), server.js runs once per cold start but
 * individual Lambda invocations don't wait for it. Mongoose buffers all
 * operations until connected, and times out after 10s if no connection exists.
 *
 * Solution: Cache the connection promise at the module level. Each request
 * calls connectDB() which either reuses an existing connection or creates one.
 * The cached connection persists across warm invocations of the same container.
 */

const mongoose = require('mongoose');

// Module-level cache — survives across warm Lambda invocations
let cached = global._mongooseConnection;

if (!cached) {
    cached = global._mongooseConnection = { conn: null, promise: null };
}

const connectDB = async () => {
    // Already connected — return immediately (fast path for warm containers)
    if (cached.conn) {
        return cached.conn;
    }

    // Connection attempt in progress — wait for it (prevents duplicate connects)
    if (!cached.promise) {
        const opts = {
            bufferCommands: false,        // Don't buffer — fail fast instead of 10s timeout
            serverSelectionTimeoutMS: 10000,
            socketTimeoutMS: 45000,
            maxPoolSize: 10,
        };

        cached.promise = mongoose
            .connect(process.env.MONGO_URI, opts)
            .then((mongooseInstance) => {
                console.log(`[db] connected → ${mongooseInstance.connection.host}`);
                return mongooseInstance;
            })
            .catch((err) => {
                console.error('[db] connection failed:', err.message);
                cached.promise = null; // Allow retry on next request
                throw err;
            });
    }

    cached.conn = await cached.promise;
    return cached.conn;
};

module.exports = connectDB;
