const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const UserData = require('../models/userData');
const { addXp } = require("../utils/xpHandler");
const  { startTriviaBattle } = require('../games/triviabattle');
const { startGeoGuessGame } = require('../games/geoguess');
const { startMathBattle } = require('../games/mathBattle');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('daily')
        .setDescription('Play your daily game to earn XP and level up!'),

    async execute(interaction) {
        if (!interaction.deferred && !interaction.replied) {
            await interaction.deferReply();
        }

        let user = await UserData.findOne({userId: interaction.user.id})
        if (!user) {
            // Create new user if they don't exist yet
            user = new UserData({
                userId: interaction.user.id,
                username: interaction.user.username,
                xp: 0,
                level: 1,
                lastDailyReward: null
            });
            await user.save();
        }

        const currentTime = Date.now();
        if (user.lastDailyReward && user.lastDailyReward && (currentTime - user.lastDailyReward.getTime()) <= 24 * 60 * 60 * 1000) {
            console.log(user);
            const nextClaim = user.lastDailyReward.getTime() + 24 * 60 * 60 * 1000;
            const discordTimestamp = `<t:${Math.floor(nextClaim / 1000)}:R>`
            return interaction.followUp({content: `You can do your next daily games: ${discordTimestamp}`})
        }

        // start one round of every game in order to gain the daily XP (+ xp from games)
        const playerMap = new Map([[interaction.user.id, interaction.user]]);
        let dailyTrivia;
        let dailyGeoGuess;
        let dailyMath;
        dailyTrivia = await startTriviaBattle(interaction, playerMap, 1);
        if (dailyTrivia) {
            dailyGeoGuess = await startGeoGuessGame(interaction, playerMap, 1);
            if (dailyGeoGuess) {
                dailyMath = await startMathBattle(interaction, playerMap, 1);
                if (dailyMath) {
                    await addXp(interaction.user.id, 50);
                    UserData.findOneAndUpdate(
                        {userId: interaction.user.id},
                        {$set: {lastDailyReward: Date.now() }},
                        { new: false, upsert: true }
                    )
                    return interaction.followUp({ content:"You have successfully done your daily games and have been awarded the XP", ephemeral: true });
                }
            }
        }

        return interaction.followUp( { content: "There was an issue with processing your daily games, please try again later.", ephemeral: true });
    }
}