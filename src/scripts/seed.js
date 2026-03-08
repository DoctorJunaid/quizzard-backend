const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Category = require('../models/Category');
const Quiz = require('../models/Quiz');
const Question = require('../models/Question');

dotenv.config({ path: __dirname + '/../../.env' });

const categoriesData = [
    {
        key: 'science',
        label: 'Science & Nature',
        description: 'Explore the wonders of biology, physics, and the universe.',
        tags: ['biology', 'physics', 'space', 'chemistry'],
        isActive: true,
    },
    {
        key: 'history',
        label: 'World History',
        description: 'Take a trip back in time and learn about ancient civilizations, wars, and empires.',
        tags: ['ancient', 'wars', 'civilizations', 'timeline'],
        isActive: true,
    },
    {
        key: 'technology',
        label: 'Tech & Computers',
        description: 'Test your knowledge on programming, hardware, internet, and AI.',
        tags: ['programming', 'hardware', 'software', 'coding', 'ai'],
        isActive: true,
    },
    {
        key: 'general-knowledge',
        label: 'General Knowledge',
        description: 'Put your random trivia facts to the ultimate test.',
        tags: ['trivia', 'mixed', 'random', 'fun'],
        isActive: true,
    }
];

const createSeedData = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB connected for seeding...');

        // Clear existing initial dummy data
        console.log('Clearing existing data...');
        await Category.deleteMany({});
        await Quiz.deleteMany({});
        await Question.deleteMany({});

        // 1. Create Categories
        const createdCategories = await Category.insertMany(categoriesData);
        console.log('Categories seeded.');

        // Reference IDs
        const scienceCat = createdCategories.find(c => c.key === 'science')._id;
        const historyCat = createdCategories.find(c => c.key === 'history')._id;
        const techCat = createdCategories.find(c => c.key === 'technology')._id;
        const gkCat = createdCategories.find(c => c.key === 'general-knowledge')._id;

        // 2. Create Quizzes (Subtopics)
        const quizzesData = [
            // Science Quizzes
            {
                title: 'Basic Astronomy',
                description: 'Test your knowledge of the solar system and beyond.',
                categoryId: scienceCat,
                tags: ['space', 'planets', 'stars'],
                difficulty: 'easy',
                timeLimit: 30,
                isPublished: true,
                isRepeatable: true
            },
            {
                title: 'Human Anatomy',
                description: 'How well do you know the human body?',
                categoryId: scienceCat,
                tags: ['biology', 'body', 'medicine'],
                difficulty: 'medium',
                timeLimit: 30,
                isPublished: true,
                isRepeatable: true
            },
            // History Quizzes
            {
                title: 'Ancient Egypt',
                description: 'How much do you know about the Pharaohs and Pyramids?',
                categoryId: historyCat,
                tags: ['egypt', 'pharaohs', 'ancient'],
                difficulty: 'medium',
                timeLimit: 30,
                isPublished: true,
                isRepeatable: true
            },
            {
                title: 'World War II',
                description: 'Test your knowledge on the major events of WWII.',
                categoryId: historyCat,
                tags: ['wars', 'timeline', 'world-war'],
                difficulty: 'hard',
                timeLimit: 45,
                isPublished: true,
                isRepeatable: true
            },
            // Tech Quizzes
            {
                title: 'Web Development 101',
                description: 'A beginner-friendly quiz on HTML, CSS, and JS.',
                categoryId: techCat,
                tags: ['html', 'css', 'js', 'web'],
                difficulty: 'easy',
                timeLimit: 20,
                isPublished: true,
                isRepeatable: true
            },
            {
                title: 'Artificial Intelligence',
                description: 'Dive into machine learning, neural networks, and AI history.',
                categoryId: techCat,
                tags: ['ai', 'machine-learning', 'future'],
                difficulty: 'medium',
                timeLimit: 30,
                isPublished: true,
                isRepeatable: true
            },
            // General Knowledge Quizzes
            {
                title: 'Geography Trivia',
                description: 'Countries, capitals, and natural landmarks.',
                categoryId: gkCat,
                tags: ['geography', 'earth', 'capitals'],
                difficulty: 'medium',
                timeLimit: 30,
                isPublished: true,
                isRepeatable: true
            },
            {
                title: 'Pop Culture & Movies',
                description: 'Do you know your Oscar winners from blockbuster hits?',
                categoryId: gkCat,
                tags: ['movies', 'pop-culture', 'entertainment'],
                difficulty: 'easy',
                timeLimit: 20,
                isPublished: true,
                isRepeatable: true
            }
        ];

        const createdQuizzes = await Quiz.insertMany(quizzesData);
        console.log('Quizzes seeded.');

        // Update category counts
        await Category.findByIdAndUpdate(scienceCat, { quizCount: 2 });
        await Category.findByIdAndUpdate(historyCat, { quizCount: 2 });
        await Category.findByIdAndUpdate(techCat, { quizCount: 2 });
        await Category.findByIdAndUpdate(gkCat, { quizCount: 2 });

        const qs = (title) => createdQuizzes.find(q => q.title === title)._id;

        // 3. Create Questions
        const questionsData = [
            // --- SCIENCE: Basic Astronomy ---
            {
                quizId: qs('Basic Astronomy'),
                text: 'Which planet is known as the Red Planet?',
                options: [
                    { text: 'Earth', isCorrect: false },
                    { text: 'Mars', isCorrect: true },
                    { text: 'Venus', isCorrect: false },
                    { text: 'Jupiter', isCorrect: false }
                ],
                explanation: 'Mars is referred to as the Red Planet due to the iron oxide on its surface.',
                order: 1
            },
            {
                quizId: qs('Basic Astronomy'),
                text: 'What is the largest planet in our solar system?',
                options: [
                    { text: 'Saturn', isCorrect: false },
                    { text: 'Earth', isCorrect: false },
                    { text: 'Jupiter', isCorrect: true },
                    { text: 'Uranus', isCorrect: false }
                ],
                explanation: 'Jupiter is the largest planet in the solar system.',
                order: 2
            },
            // --- SCIENCE: Human Anatomy ---
            {
                quizId: qs('Human Anatomy'),
                text: 'Which is the largest organ in the human body by surface area?',
                options: [
                    { text: 'Heart', isCorrect: false },
                    { text: 'Liver', isCorrect: false },
                    { text: 'Skin', isCorrect: true },
                    { text: 'Brain', isCorrect: false }
                ],
                explanation: 'The skin is the body\'s largest organ.',
                order: 1
            },
            // --- HISTORY: Ancient Egypt ---
            {
                quizId: qs('Ancient Egypt'),
                text: 'Who was the last active ruler of the Ptolemaic Kingdom of Egypt?',
                options: [
                    { text: 'Cleopatra', isCorrect: true },
                    { text: 'Nefertiti', isCorrect: false },
                    { text: 'Hatshepsut', isCorrect: false },
                    { text: 'Tutankhamun', isCorrect: false }
                ],
                explanation: 'Cleopatra was the last active ruler of the Ptolemaic Kingdom.',
                order: 1
            },
            // --- HISTORY: World War II ---
            {
                quizId: qs('World War II'),
                text: 'In what year did World War II end?',
                options: [
                    { text: '1941', isCorrect: false },
                    { text: '1945', isCorrect: true },
                    { text: '1950', isCorrect: false },
                    { text: '1939', isCorrect: false }
                ],
                explanation: 'World War II concluded in 1945.',
                order: 1
            },
            // --- TECH: Web Development 101 ---
            {
                quizId: qs('Web Development 101'),
                text: 'What does HTML stand for?',
                options: [
                    { text: 'Hyper Text Markup Language', isCorrect: true },
                    { text: 'High Text Machine Language', isCorrect: false },
                    { text: 'Hyperlink and Text Markup Language', isCorrect: false },
                    { text: 'Home Tool Markup Language', isCorrect: false }
                ],
                explanation: 'HTML stands for Hyper Text Markup Language.',
                order: 1
            },
            {
                quizId: qs('Web Development 101'),
                text: 'Which property is used in CSS to change the background color?',
                options: [
                    { text: 'color', isCorrect: false },
                    { text: 'bgcolor', isCorrect: false },
                    { text: 'background-color', isCorrect: true },
                    { text: 'bg', isCorrect: false }
                ],
                explanation: 'The background-color property is used to set the background color of an element.',
                order: 2
            },
            // --- TECH: Artificial Intelligence ---
            {
                quizId: qs('Artificial Intelligence'),
                text: 'Who is considered the father of artificial intelligence?',
                options: [
                    { text: 'Alan Turing', isCorrect: true },
                    { text: 'Elon Musk', isCorrect: false },
                    { text: 'Bill Gates', isCorrect: false },
                    { text: 'Steve Jobs', isCorrect: false }
                ],
                explanation: 'Alan Turing is widely considered to be the father of theoretical computer science and AI.',
                order: 1
            },
            // --- GK: Geography Trivia ---
            {
                quizId: qs('Geography Trivia'),
                text: 'What is the capital of Japan?',
                options: [
                    { text: 'Seoul', isCorrect: false },
                    { text: 'Beijing', isCorrect: false },
                    { text: 'Tokyo', isCorrect: true },
                    { text: 'Kyoto', isCorrect: false }
                ],
                explanation: 'Tokyo is the capital city of Japan.',
                order: 1
            },
            // --- GK: Pop Culture ---
            {
                quizId: qs('Pop Culture & Movies'),
                text: 'Who played Jack in Titanic?',
                options: [
                    { text: 'Brad Pitt', isCorrect: false },
                    { text: 'Leonardo DiCaprio', isCorrect: true },
                    { text: 'Johnny Depp', isCorrect: false },
                    { text: 'Tom Cruise', isCorrect: false }
                ],
                explanation: 'Leonardo DiCaprio starred as Jack Dawson in Titanic.',
                order: 1
            }
        ];

        await Question.insertMany(questionsData);
        console.log('Questions seeded.');

        // Efficiently update totalQuestions for each quiz
        const allQuizzes = await Quiz.find();
        for (const q of allQuizzes) {
            const count = questionsData.filter(qd => qd.quizId.toString() === q._id.toString()).length;
            await Quiz.findByIdAndUpdate(q._id, { totalQuestions: count });
        }

        console.log('Seeding completed successfully!');
        process.exit(0);

    } catch (error) {
        console.error('Error seeding data:', error);
        process.exit(1);
    }
};

createSeedData();
