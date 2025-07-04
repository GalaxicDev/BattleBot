const mongoose = require('mongoose');

const geoGuessLeaderboardSchema = new mongoose.Schema({
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

const GeoGuessLeaderboard = mongoose.model('GeoGuessLeaderboard', geoGuessLeaderboardSchema);

module.exports = GeoGuessLeaderboard;