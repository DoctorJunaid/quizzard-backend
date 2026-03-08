/**
 * check_cats.js
 */
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
const mongoose = require('mongoose');
const Category = require('../models/Category');

async function main() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const cats = await Category.find({});
        console.log(JSON.stringify(cats, null, 2));
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
main();
