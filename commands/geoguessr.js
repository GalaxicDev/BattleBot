const { SlashCommandBuilder } = require('discord.js');
const { startMultiplayerGeoGuess, startChallengeGeoGuess } = require('../utils/geoLobbyManager');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('geoguess')
        .setDescription('Play the GeoGuess outline game!')
        .addStringOption(option =>
            option.setName('mode')
                .setDescription('Choose game mode')
                .setRequired(true)
                .addChoices(
                    { name: 'start', value: 'start' },
                    { name: 'challenge', value: 'challenge' }
                )
        )
        .addUserOption(option =>
            option.setName('user')
                .setDescription('User to challenge (only for challenge mode)')
                .setRequired(false)
        )
        .addIntegerOption(option =>
            option.setName('rounds')
                .setDescription('Number of rounds (default: 5)')
                .setMinValue(1)
                .setMaxValue(20)
        ),

    async execute(interaction) {
        const mode = interaction.options.getString('mode');
        const user = interaction.options.getUser('user');
        const rounds = interaction.options.getInteger('rounds') || 5;

        if (mode === 'start') {
            return await startMultiplayerGeoGuess(interaction, rounds);
        }

        if (mode === 'challenge') {
            if (!user) {
                return await interaction.reply({ content: 'You must mention a user to challenge.', ephemeral: true });
            }
            if (user.id === interaction.user.id) {
                return await interaction.reply({ content: 'You cannot challenge yourself.', ephemeral: true });
            }
            return await startChallengeGeoGuess(interaction, user, rounds);
        }

        return await interaction.reply({ content: 'Invalid mode selected.', ephemeral: true });
    }
};
