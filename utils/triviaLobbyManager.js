const {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    EmbedBuilder,
    ComponentType,
} = require('discord.js');

const { startTriviaBattle } = require('../games/triviabattle'); // Adjust the path as necessary

async function startMultiplayerGame(interaction) {
    const lobbyPlayers = new Map();
    const lobbyId = `${interaction.guild.id}-${Date.now()}`;
    const LOBBY_DURATION = 10_000;
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
                return i.update({ content: 'You already joined!', ephemeral: true });
            }
            lobbyPlayers.set(i.user.id, i.user);
        } else if (i.customId === `leave_trivia_${lobbyId}`) {
            if (!lobbyPlayers.has(i.user.id)) {
                return i.update({ content: 'You are not in the lobby!', ephemeral: true });
            }
            if (i.user.id === interaction.user.id) {
                return i.update({ content: 'The lobby creator cannot leave.', ephemeral: true });
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

        await startTriviaBattle(interaction, lobbyPlayers);
    });
}

async function startChallengeGame(interaction, challengedUser) {
    const challenger = interaction.user;

    const challengeEmbed = new EmbedBuilder()
        .setTitle('Trivia Duel')
        .setDescription(`${challenger} has challenged ${challengedUser} to a trivia duel!\nDo you accept?`)
        .setColor(0x5865F2)
        .setTimestamp();

    const acceptButton = new ButtonBuilder()
        .setCustomId(`accept_challenge_${challenger.id}_${interaction.guild.id}`)
        .setLabel('Accept')
        .setStyle(ButtonStyle.Success);

    const declineButton = new ButtonBuilder()
        .setCustomId(`decline_challenge_${challenger.id}_${interaction.guild.id}`)
        .setLabel('Decline')
        .setStyle(ButtonStyle.Danger);

    const row = new ActionRowBuilder().addComponents(acceptButton, declineButton);

    // Only reply ONCE
    const replyMsg = await interaction.reply({
        content: `${challengedUser}`,
        embeds: [challengeEmbed],
        components: [row],
    });

    const filter = i =>
        i.customId.startsWith('accept_challenge_') ||
        i.customId.startsWith('decline_challenge_');

    const collector = replyMsg.createMessageComponentCollector({ filter, time: 30_000 });

    let responded = false;

    collector.on('collect', async (i) => {
        if (i.user.id !== challengedUser.id) {
            return i.reply({
                content: 'Only the challenged user can respond to this challenge.',
                ephemeral: true
            });
        }

        responded = true;
        collector.stop();

        if (i.customId.startsWith('accept_challenge_')) {
            await i.update({
                content: `${challengedUser} accepted the challenge!`,
                components: [],
                embeds: []
            });

            const playerMap = new Map([
                [challenger.id, challenger],
                [challengedUser.id, challengedUser]
            ]);

            // Pass the reply message to startTriviaBattle for editing
            await startTriviaBattle(interaction, playerMap, replyMsg);

        } else if (i.customId.startsWith('decline_challenge_')) {
            await i.update({
                content: `${challengedUser} declined the challenge.`,
                components: [],
                embeds: []
            });
        }
    });

    collector.on('end', async () => {
        if (!responded) {
            try {
                await replyMsg.edit({
                    content: `${challengedUser} did not respond in time. Challenge expired.`,
                    components: [],
                    embeds: []
                });
            } catch (err) {
                console.warn("Edit on timeout failed:", err);
            }
        }
    });
}

module.exports = {
    startMultiplayerGame,
    startChallengeGame
};