const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const MathGameLeaderboard = require('../models/mathGameLeaderboard');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('mathleaderboard')
        .setDescription('View the Math Battle leaderboard'),

    async execute(interaction) {
        if (!interaction.deferred && !interaction.replied) {
            await interaction.deferReply();
        }

        const leaderboard = await MathGameLeaderboard.find().sort({ score: -1 }).limit(10);

        if (leaderboard.length === 0) {
            return await interaction.editReply({ content: 'No Math Battle games have been played yet.' });
        }

        const medalEmojis = ['🥇', '🥈', '🥉'];

        const embed = new EmbedBuilder()
            .setTitle('Math Battle Leaderboard')
            .setColor(0xf1c40f)
            .setTimestamp()
            .setFooter({ text: 'Top 10 Math Battle Players' });

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
