const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const UserData = require('../models/userData');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('levelleaderboard')
        .setDescription('View the level leaderboard'),

    async execute(interaction) {
        if (!interaction.deferred && !interaction.replied) {
            await interaction.deferReply();
        }

        const leaderboard = await UserData.find().sort({ xp: -1 }).limit(10);

        if (leaderboard.length === 0) {
            return await interaction.editReply({ content: 'No games have been played yet.' });
        }

        const medalEmojis = ['🥇', '🥈', '🥉'];

        const embed = new EmbedBuilder()
            .setTitle('Level Leaderboard')
            .setColor(0xf1c40f)
            .setTimestamp()
            .setFooter({ text: 'Top 10 Math Battle Players' });

        leaderboard.forEach((entry, index) => {
            const medal = medalEmojis[index] || `#${index + 1}`;
            embed.addFields(
                { name: `${medal} ${entry.username}`, value: ``, inline: false },
                { name: 'Level', value: `${entry.level || 0}`, inline: true },
                { name: 'XP', value: `${entry.xp || 0}`, inline: true },
                { name: 'Total Games', value: `${entry.gamesPlayed || 0}`, inline: true },
                { name: 'Total Wins', value: `${entry.gamesWon || 0}`, inline: true },
                { name: 'Total Losses', value: `${entry.gamesLost || 0}`, inline: true }
            );
        });

        await interaction.editReply({ embeds: [embed] });
    }
};
