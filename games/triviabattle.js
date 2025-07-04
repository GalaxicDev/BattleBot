const {
    ActionRowBuilder,
    EmbedBuilder,
    StringSelectMenuBuilder,
    StringSelectMenuOptionBuilder
} = require('discord.js');

const TriviaQuestion = require('../models/triviaModel');
const TriviaLeaderboard = require('../models/triviaLeaderboard');
const { addXp } = require("../utils/xpHandler");

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

async function startTriviaBattle(interaction, playerMap, rounds = 5) {
    if (!interaction.deferred && !interaction.replied) {
        await interaction.deferReply();
    }

    const totalRounds = rounds;
    const roundDuration = 20 * 1000;
    const players = new Map();

    for (const [id, user] of playerMap) {
        players.set(id, { user, score: 0 });
    }

    let roundMessage;
    for (let round = 0; round < totalRounds; round++) {
        const count = await TriviaQuestion.countDocuments();
        const random = Math.floor(Math.random() * count);
        const questionData = await TriviaQuestion.findOne().skip(random);
        const allAnswers = shuffle([questionData.correct_answer, ...questionData.incorrect_answers]);

        console.log(questionData.correct_answer);
        const endTime = Date.now() + roundDuration;

        const createRoundEmbed = () => new EmbedBuilder()
            .setTitle(`Trivia Time!`)
            .setDescription(`**Question ${round + 1}/${totalRounds}**\n${questionData.question}`)
            .setColor(0x3498DB)
            .addFields(
                { name: 'Category', value: questionData.category, inline: true },
                { name: 'Difficulty', value: questionData.difficulty, inline: true },
                { name: 'Time Remaining', value: `<t:${Math.floor(endTime / 1000)}:R>`, inline: true }
            )
            .setFooter({ text: `Round ${round + 1}/${totalRounds}` })
            .setTimestamp();

        const createAnswerEmbed = (correctAnswer) => new EmbedBuilder()
            .setTitle(`Trivia Round ${round + 1}/${totalRounds} - Answer Revealed`)
            .setDescription(`**${questionData.question}**\n\nThe correct answer was: **${correctAnswer}**\n\nCategory: ${questionData.category} | Difficulty: ${questionData.difficulty}`)
            .setColor(0x5865F2)
            .setFooter({ text: `Round ${round + 1}/${totalRounds}` });

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
            await interaction.editReply({
                content: `**Round ${round + 1}/${totalRounds}**`,
                embeds: [createRoundEmbed()],
                components: [row]
            });
            roundMessage = await interaction.fetchReply(); // ✅ This is essential
        } else {
            await roundMessage.edit({
                content: `**Round ${round + 1}/${totalRounds}**`,
                embeds: [createRoundEmbed()],
                components: [row]
            });
        }

        const filter = i => i.customId === `trivia_select_${round}` && players.has(i.user.id);
        const collector = roundMessage.createMessageComponentCollector({
            filter,
            time: roundDuration,
        });
        const answered = new Set();
        const userAnswers = new Map();
        collector.on('collect', async i => {
            if (!players.has(i.user.id)) {
                return i.reply({ content: 'You are not a participant in this trivia battle.', ephemeral: true });
            }

            userAnswers.set(i.user.id, i.values[0]);
        });

        await new Promise(resolve => collector.on('end', resolve));

        // check if the user has answered correctly and update their score
        for (const [id, player] of players) {
            if (userAnswers.has(id)) {
                const answer = userAnswers.get(id);
                if (answer === questionData.correct_answer) {
                    const scoreAmount = getPoints(questionData.difficulty);
                    player.score += scoreAmount;
                    await addXp(id, scoreAmount * 2);
                } else {
                    await addXp(id, 1);
                }
            }
        }

        // Show the correct answer after round ends
        await roundMessage.edit({
            embeds: [createAnswerEmbed(questionData.correct_answer)],
            components: []
        });

        await new Promise(resolve => setTimeout(resolve, 5000));
    }

    // Final leaderboard
    const finalScores = Array.from(players.values())
        .sort((a, b) => b.score - a.score)
        .map(p => `${p.user.username}: ${p.score} points`)
        .join('\n');

    const maxScore = Math.max(...Array.from(players.values()).map(p => p.score));
    for (const [id, player] of players) {
        const entry = await TriviaLeaderboard.findOneAndUpdate(
            { userId: id },
            {
                $inc: { score: player.score, gamesPlayed: 1 },
                username: player.user.username,
                lastUpdated: new Date()
            },
            { new: true, upsert: true }
        );

        if (player.score === maxScore && maxScore > 0) entry.gamesWon++;
        else entry.gamesLost++;

        await entry.save();

        await addXp(id, 3);
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

module.exports = {
    startTriviaBattle,
    getPoints,
    shuffle,
    TriviaQuestion
};
