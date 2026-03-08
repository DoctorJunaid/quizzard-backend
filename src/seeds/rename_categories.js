/**
 * rename_categories.js
 * Merges Computer Science and Tech & Computers.
 */
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
const mongoose = require('mongoose');
const Category = require('../models/Category');
const Quiz = require('../models/Quiz');

async function main() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('[rename] Connected.');

        const csCat = await Category.findOne({ key: 'computer-science' });
        const techCat = await Category.findOne({ key: 'technology' });

        if (csCat && techCat) {
            console.log('[rename] Found both categories. Moving CS quizzes to Tech & Computers...');
            const res = await Quiz.updateMany({ categoryId: csCat._id }, { categoryId: techCat._id });
            console.log(`[rename] Moved ${res.modifiedCount} quizzes.`);

            // Update the merged category image/label to something premium if needed
            techCat.label = 'Tech & Computers';
            techCat.image = 'https://plus.unsplash.com/premium_photo-1678565869434-c81195861939?q=80&w=870&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D';
            await techCat.save();

            await Category.deleteOne({ _id: csCat._id });
            console.log('[rename] Deleted CS category.');
        } else if (csCat) {
            console.log('[rename] Only CS found. Just renaming it...');
            csCat.label = 'Tech & Computers';
            csCat.key = 'technology';
            csCat.image = 'https://plus.unsplash.com/premium_photo-1678565869434-c81195861939?q=80&w=870&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D';
            await csCat.save();
        }

        // Globally update timeLimit to 20s
        await Quiz.updateMany({}, { timeLimit: 20 });
        console.log('[rename] Updated all quizzes to 20s time limit.');

        process.exit(0);
    } catch (err) {
        console.error('[rename] Error:', err);
        process.exit(1);
    }
}
main();
