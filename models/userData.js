const mongoose = require('mongoose');

const userDataSchema = new mongoose.Schema({
    userId: { type: String, required: true, unique: true },
    username: { type: String, required: true },
    gamesPlayed: { type: Number, default: 0 },
    gamesWon: { type: Number, default: 0 },
    gamesLost: { type: Number, default: 0 },
    score: { type: Number, default: 0 },
    xp: { type: Number, default: 0 },
    level: { type: Number, default: 1 },
    lastGameDate: { type: Date, default: Date.now }
});

const UserData = mongoose.model('UserData', userDataSchema);

module.exports = UserData;
