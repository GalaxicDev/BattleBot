const mongoose = require('mongoose');

const mathGameLeaderboardSchema = new mongoose.Schema({
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
        required: true,
        default: 0
    },
    gamesPlayed: {
        type: Number,
        required: true,
        default: 0
    },
    gamesWon: {
        type: Number,
        required: true,
        default: 0
    },
    gamesLost: {
        type: Number,
        required: true,
        default: 0
    },
    lastUpdated: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

const MathGameLeaderboard = mongoose.model('MathGameLeaderboard', mathGameLeaderboardSchema);

module.exports = MathGameLeaderboard;