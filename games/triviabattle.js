const {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    EmbedBuilder,
    ComponentType,
} = require('discord.js');

async function startMultiplayerGame(interaction) {
    const lobbyPlayers = new Map();
    const lobbyId = `${interaction.guild.id}-${Date.now()}`;
    const LOBBY_DURATION = 60_000;
    const UPDATE_INTERVAL = 1000; // update every second

    lobbyPlayers.set(interaction.user.id, interaction.user);

    const getPlayerList = () =>
        Array.from(lobbyPlayers.values()).map(user => `• ${user.username}`).join('\n') || '_None yet!_';

    const createRow = () => new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId(`join_trivia_${lobbyId}`)
                .setLabel('Join Trivia')
                .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
                .setCustomId(`leave_trivia_${lobbyId}`)
                .setLabel('Leave Trivia')
                .setStyle(ButtonStyle.Danger)
        );

    const endTime = Date.now() + LOBBY_DURATION;

    const createLobbyEmbed = () => {
        const timeLeft = Math.max(0, Math.floor((endTime - Date.now()) / 1000));
        return new EmbedBuilder()
            .setTitle('Trivia Battle Lobby')
            .setDescription(
                `Click **Join Trivia** to enter!\n` +
                `Game starts in **${timeLeft}s**.\n\n` +
                `**Players Joined (${lobbyPlayers.size}):**\n${getPlayerList()}`
            )
            .setColor(0x5865F2)
            .setFooter({ text: `Lobby ID: ${lobbyId}` })
            .setTimestamp();
    };

    const reply = await interaction.reply({
        embeds: [createLobbyEmbed()],
        components: [createRow()],
        fetchReply: true,
    });

    // Collector for buttons
    const collector = reply.createMessageComponentCollector({
        componentType: ComponentType.Button,
        time: LOBBY_DURATION,
        filter: i =>
            i.customId === `join_trivia_${lobbyId}` || i.customId === `leave_trivia_${lobbyId}`,
    });

    collector.on('collect', async (i) => {
        if (i.customId === `join_trivia_${lobbyId}`) {
            if (lobbyPlayers.has(i.user.id)) {
                return i.reply({ content: 'You already joined!', ephemeral: true });
            }
            lobbyPlayers.set(i.user.id, i.user);
        } else if (i.customId === `leave_trivia_${lobbyId}`) {
            if (!lobbyPlayers.has(i.user.id)) {
                return i.reply({ content: 'You are not in the lobby!', ephemeral: true });
            }
            if (i.user.id === interaction.user.id) {
                return i.reply({ content: 'The lobby creator cannot leave.', ephemeral: true });
            }
            lobbyPlayers.delete(i.user.id);
        }

        // Update embed with current time
        await i.update({ embeds: [createLobbyEmbed()], components: [createRow()] });
    });

    // Accurate time updater
    const interval = setInterval(async () => {
        const timeLeft = endTime - Date.now();
        if (timeLeft <= 0) {
            clearInterval(interval);
            collector.stop();
        } else {
            await reply.edit({ embeds: [createLobbyEmbed()] });
        }
    }, UPDATE_INTERVAL);

    collector.on('end', async () => {
        clearInterval(interval);

        if (lobbyPlayers.size < 2) {
            return await interaction.editReply({
                content: 'Not enough players joined the lobby. Game cancelled.',
                components: [],
            });
        }

        await interaction.editReply({
            content: `Starting trivia game with ${lobbyPlayers.size} players...`,
            components: [],
        });

        // TODO: Trigger actual game here
        console.log('Start game with:', Array.from(lobbyPlayers.values()).map(u => u.username));
    });
}

module.exports = {
    startMultiplayerGame,
};
