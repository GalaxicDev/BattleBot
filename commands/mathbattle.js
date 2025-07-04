const { SlashCommandBuilder } = require('discord.js');
const { createGameLobby, createChallengeGame } = require('../utils/lobbyManager');
const { startMathBattle } = require('../games/mathBattle');

async function startMultiplayerGame(interaction, rounds = 5) {
    return await createGameLobby({
        interaction,
        gameName: 'Math Battle',
        joinLabel: 'Join Battle',
        leaveLabel: 'Leave Lobby',
        minPlayers: 2,
        onStart: async (interaction, playersMap) => {
            await startMathBattle(interaction, playersMap, rounds);
        }
    });
}

async function startChallengeGame(interaction, challengedUser, rounds = 5) {
    return await createChallengeGame({
        interaction,
        gameName: 'Math Battle',
        challenger: interaction.user,
        challengedUser,
        onAccept: async (interaction, playersMap) => {
            await startMathBattle(interaction, playersMap, rounds);
        }
    });
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('mathbattle')
        .setDescription('Play the Math Battle game!')
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
            return await startMultiplayerGame(interaction, rounds);
        }

        if (mode === 'challenge') {
            if (!user) {
                return await interaction.reply({ content: 'You must mention a user to challenge.', ephemeral: true });
            }
            if (user.id === interaction.user.id) {
                return await interaction.reply({ content: 'You cannot challenge yourself.', ephemeral: true });
            }
            return await startChallengeGame(interaction, user, rounds);
        }

        return await interaction.reply({ content: 'Invalid mode selected.', ephemeral: true });
    }
};