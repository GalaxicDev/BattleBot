const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const UserData = require('../models/userData');
const {addXp} = require("../utils/xpHandler");

module.exports = {
    data: new SlashCommandBuilder()
        .setName('profile')
        .setDescription('View all information about a users game progress.')
        .addUserOption(option =>
            option.setName('user')
            .setDescription('User to view level and XP for')
            .setRequired(false)
        ),

    async execute(interaction) {
        if (!interaction.deferred && !interaction.replied) {
            await interaction.deferReply();
        }

        let user;
        if (interaction.options.getUser('user')) {
            user = await UserData.findOne({ userId: interaction.options.getUser('user').id });
        } else {
            user = await UserData.findOne({ userId: interaction.user.id });
        }

        if (!user) {
            return await interaction.editReply({ content: 'You haven\'t earned any XP yet.' });
        }

        const embed = new EmbedBuilder()
            .setTitle(`${interaction.user.username} - Level`)
            .setColor(0xf1c40f)
            .setAuthor({iconURL: interaction.user.displayAvatarURL(), name: interaction.user.username})
            .addFields(
                { name: 'Level', value: user.level?.toString() ?? '0', inline: true },
                { name: 'XP', value: user.xp?.toString() ?? '0', inline: true },
                { name: 'Next Level XP', value: ((user.level + 1) * (user.level + 1) * 100).toString(), inline: true }
            )
            .setTimestamp()
            .setFooter({ text: 'XP and Level Information' });

        await interaction.editReply({ embeds: [embed] });
    }
};
