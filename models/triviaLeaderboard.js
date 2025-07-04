const mongoose = require('mongoose');

const triviaLeaderboardSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true,
        unique: true
    },
    username: {
        type: String,
        required: true
    },
    score: {
        type: Number,
        default: 0
    },
    gamesPlayed: {
        type: Number,
        default: 0
    },
    gamesWon: {
        type: Number,
        default: 0
    },
    gamesLost: {
        type: Number,
        default: 0
    },
    lastUpdated: {
        type: Date,
        default: Date.now
    }
});

const TriviaLeaderboard = mongoose.model('TriviaLeaderboard', triviaLeaderboardSchema);

module.exports = TriviaLeaderboard;