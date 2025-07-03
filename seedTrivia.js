require('dotenv').config();
const axios = require('axios');
const mongoose = require('mongoose');
const he = require('he');

// MongoDB connection
console.log('Connecting to MongoDB...');
mongoose.connect(process.env.MONGO_URI);

const triviaSchema = new mongoose.Schema({
    category: String,
    difficulty: String,
    type: String,
    question: String,
    correct_answer: String,
    incorrect_answers: [String]
});

const TriviaQuestion = mongoose.model('TriviaQuestion', triviaSchema);

// Fetch and insert function
async function fetchAndStoreQuestions(categoryId, amount = 25) {
    const res = await axios.get('https://opentdb.com/api.php', {
        params: {
            amount,
            category: categoryId,
            type: 'multiple',
        }
    });

    const data = res.data.results.map(q => ({
        category: he.decode(q.category),
        difficulty: q.difficulty,
        type: q.type,
        question: he.decode(q.question),
        correct_answer: he.decode(q.correct_answer),
        incorrect_answers: q.incorrect_answers.map(ans => he.decode(ans)),
    }));

    await TriviaQuestion.insertMany(data);
    console.log(`Inserted ${data.length} questions from category ID ${categoryId}`);
}

// Multiple categories
const categoryIds = [9, 11, 12, 17, 18, 22, 23, 24]; // General Knowledge, Films, Music, Science, Computers, Geography, History, Politics

async function seedAll() {
    for (const id of categoryIds) {
        for (let i = 0; i < 4; i++) {
            await fetchAndStoreQuestions(id, 50); // 200 per category
            await new Promise(res => setTimeout(res, 5000)); // 5 second delay
        }
        await new Promise(res => setTimeout(res, 5000)); // 5 second delay between categories
    }
    console.log('All questions inserted!');
    await mongoose.disconnect();
}

seedAll().catch(console.error);
