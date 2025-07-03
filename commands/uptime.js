const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('uptime')
        .setDescription('Displays the bot\'s uptime in seconds.'),

    async execute(interaction) {
        const uptime = Math.floor(process.uptime());
        await interaction.reply(`The bot has been running for ${uptime} seconds.`);
    }
}