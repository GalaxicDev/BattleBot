const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const TriviaLeaderboard = require('../models/triviaLeaderboard');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('trivialeaderboard')
        .setDescription('View the trivia leaderboard'),

    async execute(interaction) {
        if (!interaction.deferred && !interaction.replied) {
            await interaction.deferReply();
        }

        const leaderboard = await TriviaLeaderboard.find().sort({ score: -1 }).limit(10);

        if (leaderboard.length === 0) {
            return await interaction.editReply({ content: 'No trivia games have been played yet.' });
        }

        const medalEmojis = ['🥇', '🥈', '🥉'];

        const embed = new EmbedBuilder()
            .setTitle('Trivia Leaderboard')
            .setColor(0xf1c40f)
            .setTimestamp()
            .setFooter({ text: 'Top 10 Trivia Players' });

        leaderboard.forEach((entry, index) => {
            const medal = medalEmojis[index] || `#${index + 1}`;
            embed.addFields({
                name: `${medal} ${entry.username}`,
                value: `**Score:** ${entry.score} | **Wins:** ${entry.gamesWon} | **Losses:** ${entry.gamesLost}`,
                inline: false
            });
        });

        await interaction.editReply({ embeds: [embed] });
    }
};
