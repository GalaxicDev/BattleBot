const mongoose = require('mongoose');

const triviaSchema = new mongoose.Schema({
    category: String,
    difficulty: String,
    type: String,
    question: String,
    correct_answer: String,
    incorrect_answers: [String]
});

const TriviaQuestion = mongoose.model('TriviaQuestion', triviaSchema);

module.exports = TriviaQuestion;