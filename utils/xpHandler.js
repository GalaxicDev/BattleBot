const UserData = require('../models/userData');

async function addXp(userId, xpToAdd) {
    const user = await UserData.findOneAndUpdate(
        { userId: userId },
        { $inc: { xp: xpToAdd } },
        { new: true, upsert: true }
    );

    const currentXp = user.xp || 0;
    const currentLevel = user.level || 1;
    const nextLevelXp = (currentLevel + 1) * (currentLevel + 1) * 100;

    if (currentXp >= nextLevelXp) {
        user.level = currentLevel + 1;
        await user.save();
    }
}

function getXp(userId) {
    return UserData.findOne({ userId: userId })
        .then(data => data ? data.xp : 0);
}

function getLevel(userId) {
    return UserData.findOne({ userId: userId })
        .then(data => {
            if (!data) return 0;
            const xp = data.xp || 0;
            return Math.floor(Math.sqrt(xp / 100));
        });
}

function getNextLevelXp(userId) {
    return UserData.findOne({ userId: userId })
        .then(data => {
            if (!data) return 100; // Default to 100 if no data exists
            const level = Math.floor(Math.sqrt(data.xp / 100));
            return (level + 1) * (level + 1) * 100; // Next level XP formula
            });
}

module.exports = {
    addXp,
    getXp,
    getLevel,
    getNextLevelXp
};



