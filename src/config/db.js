/**
 * config/db.js
 * Establishes the Mongoose connection to MongoDB.
 * Called once at startup from server.js.
 */

const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI);
        console.log(`[db] connected → ${conn.connection.host}`);
    } catch (err) {
        console.error('[db] connection failed:', err.message);
        process.exit(1); // Fatal – cannot run without the database
    }
};

module.exports = connectDB;
