const {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    EmbedBuilder,
    ComponentType
} = require('discord.js');

async function createGameLobby({
                                   interaction,
                                   gameName = 'Game',
                                   joinLabel = 'Join Game',
                                   leaveLabel = 'Leave Lobby',
                                   onStart,
                                   lobbyDuration = 60_000,
                                   minPlayers = 2,
                               }) {
    const players = new Map();
    const lobbyId = `${interaction.guild.id}-${Date.now()}`;
    const endTime = Date.now() + lobbyDuration;

    players.set(interaction.user.id, interaction.user);

    const getPlayerList = () =>
        Array.from(players.values()).map(u => `• ${u.username}`).join('\n');

    const createEmbed = () => {
        const timeLeft = Math.max(0, Math.floor((endTime - Date.now()) / 1000));
        return new EmbedBuilder()
            .setTitle(`${gameName} Lobby`)
            .setDescription(
                `Click **${joinLabel}** to enter!\n` +
                `Game starts in **${timeLeft}s**.\n\n` +
                `**Players (${players.size}):**\n${getPlayerList()}`
            )
            .setColor(0x3498DB)
            .setFooter({ text: `Lobby ID: ${lobbyId}` })
            .setTimestamp();
    };

    const createButtons = () => new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId(`join_${lobbyId}`)
                .setLabel(joinLabel)
                .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
                .setCustomId(`leave_${lobbyId}`)
                .setLabel(leaveLabel)
                .setStyle(ButtonStyle.Danger)
        );

    const reply = await interaction.reply({
        embeds: [createEmbed()],
        components: [createButtons()],
        fetchReply: true
    });

    const collector = reply.createMessageComponentCollector({
        componentType: ComponentType.Button,
        time: lobbyDuration,
        filter: i =>
            i.customId === `join_${lobbyId}` || i.customId === `leave_${lobbyId}`
    });

    collector.on('collect', async i => {
        if (i.customId.startsWith('join')) {
            if (players.has(i.user.id)) {
                return i.reply({ content: 'You already joined.', ephemeral: true });
            }
            players.set(i.user.id, i.user);
        } else {
            if (!players.has(i.user.id)) {
                return i.reply({ content: 'You’re not in the lobby.', ephemeral: true });
            }
            if (i.user.id === interaction.user.id) {
                return i.reply({ content: 'The host cannot leave.', ephemeral: true });
            }
            players.delete(i.user.id);
        }

        await i.update({ embeds: [createEmbed()], components: [createButtons()] });
    });

    const interval = setInterval(() => {
        const timeLeft = endTime - Date.now();
        if (timeLeft <= 0) {
            clearInterval(interval);
            collector.stop();
        } else {
            reply.edit({ embeds: [createEmbed()] }).catch(() => {});
        }
    }, 1000);

    collector.on('end', async () => {
        clearInterval(interval);
        if (players.size < minPlayers) {
            return await interaction.editReply({
                content: `Not enough players joined. ${gameName} cancelled.`,
                components: []
            });
        }

        await onStart(interaction, players);
    });
}

async function createChallengeGame({
                                       interaction,
                                       gameName = 'Game',
                                       challenger,
                                       challengedUser,
                                       onAccept,
                                       timeoutMs = 30000
                                   }) {
    const embed = new EmbedBuilder()
        .setTitle(`${gameName} Duel`)
        .setDescription(`${challenger} has challenged ${challengedUser} to a ${gameName} duel!`)
        .setColor(0x2ecc71)
        .setTimestamp();

    const accept = new ButtonBuilder()
        .setCustomId('accept_challenge')
        .setLabel('Accept')
        .setStyle(ButtonStyle.Success);

    const decline = new ButtonBuilder()
        .setCustomId('decline_challenge')
        .setLabel('Decline')
        .setStyle(ButtonStyle.Danger);

    const row = new ActionRowBuilder().addComponents(accept, decline);

    const msg = await interaction.reply({
        content: `${challengedUser}`,
        embeds: [embed],
        components: [row],
        fetchReply: true
    });

    const filter = i =>
        i.user.id === challengedUser.id &&
        ['accept_challenge', 'decline_challenge'].includes(i.customId);

    const collector = msg.createMessageComponentCollector({ filter, time: timeoutMs });

    collector.on('collect', async (i) => {
        collector.stop();
        if (i.customId === 'accept_challenge') {
            await i.update({
                content: `${challengedUser} accepted the challenge!`,
                components: [],
                embeds: []
            });

            const playerMap = new Map([
                [challenger.id, challenger],
                [challengedUser.id, challengedUser]
            ]);

            await onAccept(interaction, playerMap);
        } else {
            await i.update({
                content: `${challengedUser} declined the challenge.`,
                components: [],
                embeds: []
            });
        }
    });

    collector.on('end', async () => {
        if (!collector.collected.size) {
            await msg.edit({
                content: `${challengedUser} did not respond in time. Challenge expired.`,
                components: [],
                embeds: []
            });
        }
    });
}

module.exports = {
    createGameLobby,
    createChallengeGame
};
