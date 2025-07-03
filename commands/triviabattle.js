const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('triviabattle')
        .setDescription('Start a trivia battle!')
        .addSubcommand(subcommand =>
            subcommand
                .setName('start')
                .setDescription('Start an open trivia lobby for anyone to join')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('challenge')
                .setDescription('Challenge a specific user to a 1v1 trivia duel')
                .addUserOption(option =>
                    option.setName('user')
                        .setDescription('The user you want to challenge')
                        .setRequired(true)
                )
        ),

    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();

        if (subcommand === 'start') {
            return await interaction.reply({ content: 'Starting an open trivia lobby is not implemented yet.' });
            //await startMultiplayerGame(interaction);
        }

        else if (subcommand === 'challenge') {
            const challengedUser = interaction.options.getUser('user');

            if (challengedUser.bot) {
                return await interaction.reply({ content: 'You can’t challenge a bot!', ephemeral: true });
            }

            if (challengedUser.id === interaction.user.id) {
                return await interaction.reply({ content: 'You can’t challenge yourself!', ephemeral: true });
            }

            return await interaction.reply({ content: `You have challenged ${challengedUser.username} to a trivia duel!` });
            //await startChallengeGame(interaction, challengedUser);
        }
    }
};
