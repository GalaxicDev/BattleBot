const { ActionRowBuilder, EmbedBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder } = require('discord.js');
const TriviaQuestion = require('../models/triviaModel');
const TriviaLeaderboard = require('../models/triviaLeaderboard');

// TODO: add timer and switch to 20sec for answer and then 5s correct answer reveal
const keySeconds = [15, 10, 5, 3, 2, 1];

function getPoints(difficulty) {
    switch (difficulty) {
        case 'easy': return 1;
        case 'medium': return 2;
        case 'hard': return 3;
        default: return 0;
    }
}

function shuffle(array) {
    return array.sort(() => Math.random() - 0.5);
}

// Accepts an optional message to edit (for challenge mode)
async function startTriviaBattle(interaction, playerMap, roundMessage = null) {
    if (interaction.deferred === false && interaction.replied === false) {
        await interaction.deferReply(); // prevent UnknownInteraction error
    }


    const totalRounds = 5;
    const roundDuration = 20 * 1000; // 30 seconds per round
    const players = new Map();

    for (const [id, user] of playerMap) {
        players.set(id, { user, score: 0});
    }

    for (let round = 0; round < totalRounds; round++) {
        const count = await TriviaQuestion.countDocuments();
        const random = Math.floor(Math.random() * count);
        const questionData = await TriviaQuestion.findOne().skip(random);
        const allAnswers = shuffle([questionData.correct_answer, ...questionData.incorrect_answers]);


        const endTime = Date.now() + roundDuration;
        const createRoundEmbed = () => {
            return new EmbedBuilder()
                .setTitle(`Trivia Time!`)
                .setDescription(`**Question ${round + 1}/${totalRounds}**\n**${questionData.question}**}`)
                .setColor(0x3498DB)
                .addFields(
                    { name: 'Category', value: questionData.category, inline: true },
                    { name: 'Difficulty', value: questionData.difficulty, inline: true },
                    { name: 'Time Remaining', value: `<t:${Math.floor(endTime / 1000)}:R>`, inline: true },
                )
                .setFooter({ text: `Round ${round + 1}/${totalRounds}` })
                .setTimestamp();
        }

        const createAnswerEmbed = (correctAnswer) => {
            return new EmbedBuilder()
                .setTitle(`Trivia Round ${round + 1}/${totalRounds} - Answer Revealed`)
                .setDescription(`**${questionData.question}**\n\nThe correct answer was: **${correctAnswer}**\n\nCategory: ${questionData.category} | Difficulty: ${questionData.difficulty}`)
                .setColor(0x5865F2)
                .setFooter({ text: `Round ${round + 1}/${totalRounds}` });
        }

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId(`trivia_select_${round}`)
            .setPlaceholder('Select your answer')
            .addOptions(
                allAnswers.map(answer =>
                    new StringSelectMenuOptionBuilder()
                        .setLabel(answer)
                        .setValue(answer)
                )
            );

        const row = new ActionRowBuilder().addComponents(selectMenu);

        if (!roundMessage) {
            // First round – send a new message
            roundMessage = await interaction.editReply({
                content: `**Round ${round + 1}/${totalRounds}**`,
                embeds: [createRoundEmbed()],
                components: [row]
            });
        } else {
            // All subsequent rounds – edit the existing message
            await roundMessage.edit({
                content: `**Round ${round + 1}/${totalRounds}**`,
                embeds: [createRoundEmbed()],
                components: [row]
            });
        }

        const answered = new Set();
        const filter = i => i.customId === `trivia_select_${round}` && playerMap.has(i.user.id) && !answered.has(i.user.id);
        const collector = roundMessage.createMessageComponentCollector({
            filter,
            time: roundDuration,
        });

        collector.on('collect', async (i) => {
            if (!players.has(i.user.id)) {
                return i.reply({ content: 'You are not a participant in this trivia battle.', ephemeral: true });
            }

            answered.add(i.user.id);
            const player = players.get(i.user.id);
            if (!player) return;

            if (i.values[0] === questionData.correct_answer) {
                player.score += getPoints(questionData.difficulty);
            }

        });

        await new Promise(resolve => collector.on('end', resolve));

        // After the round ends, show the correct answer
        await roundMessage.edit({
            embeds: [createAnswerEmbed(questionData.correct_answer)],
            components: []
        });

        await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds before next round
    }

    const finalScores = Array.from(players.values())
        .sort((a, b) => b.score - a.score)
        .map(player => `${player.user.username}: ${player.score} points`)
        .join('\n');


    const maxScore = Math.max(...Array.from(players.values()).map(p => p.score));
    for (const [id, player] of players) {
        const leaderboardEntry = await TriviaLeaderboard.findOneAndUpdate(
            { userId: id },
            {
                $inc: { score: player.score, gamesPlayed: 1 },
                lastUpdated: new Date(),
                username: player.user.username
            },
            { new: true, upsert: true }
        );

        if (player.score === maxScore && maxScore > 0) {
            leaderboardEntry.gamesWon += 1;
        } else {
            leaderboardEntry.gamesLost += 1;
        }
        await leaderboardEntry.save();
    }

    const finalEmbed = new EmbedBuilder()
        .setTitle('Trivia Battle Results')
        .setDescription(`**Final Scores:**\n${finalScores}`)
        .setColor(0x5865F2)
        .setFooter({ text: 'Thanks for playing!' });

    await roundMessage.edit({
        content: null,
        embeds: [finalEmbed],
        components: []
    });
}

module.exports = { startTriviaBattle, getPoints, shuffle, TriviaQuestion };