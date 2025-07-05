const { evaluate } = require('mathjs');
const {
    ActionRowBuilder,
    EmbedBuilder,
    StringSelectMenuBuilder,
    StringSelectMenuOptionBuilder
} = require('discord.js');

const MathGameLeaderboard = require('../models/mathGameLeaderboard');
const UserData = require('../models/userData');
const { addXp, getXp, getLevel, getNextLevelXp } = require('../utils/xpHandler');

function shuffle(array) {
    return array.sort(() => Math.random() - 0.5);
}

function getPoints(difficulty) {
    switch (difficulty) {
        case 'easy': return 1;
        case 'medium': return 2;
        case 'hard': return 3;
        case 'missing': return 1;
        default: return 0;
    }
}

function generateMathProblem(difficulty = 'easy') {
    let question = '';
    let correctAnswer = 0;

    const getRandom = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

    switch (difficulty) {
        case 'easy': {
            console.log('difficulty: easy');
            const a = getRandom(10, 50);
            const b = getRandom(10, 50);
            const op = ['+', '-'][getRandom(0, 1)];

            question = `${a} ${op} ${b}`;
            console.log(`Question: ${question}`);
            break;
        }
        case 'medium': {
            console.log('difficulty: medium');
            const a = getRandom(5, 20);
            const b = getRandom(5, 20);
            const c = getRandom(1, 10);

            const op1 = ['+', '-', '*'][getRandom(0, 2)];
            const op2 = ['+', '-', '*'][getRandom(0, 2)];
            question = `(${a} ${op1} ${b}) ${op2} ${c}`;
            console.log(`Question: ${question}`);
            break;
        }

        case 'hard': {
            console.log('difficulty: hard');
            const a = getRandom(1, 5);
            const b = getRandom(1, 4);
            const c = getRandom(10, 50);

            const op1 = ['+', '-', '*', '/'][getRandom(0, 3)];
            const power = `${a}^${b}`;
            question = `(${power}) ${op1} ${c}`
            console.log(`Question: ${question}`);
            break;
        }

        case 'missing': {
            const a = getRandom(1, 30);
            const b = getRandom(1, 30);
            const result = a + b;
            const missingIndex = getRandom(0, 1);
            if (missingIndex === 0) {
                question = `? + ${b} = ${result}`;
                console.log(`Question: ${question}`);
                correctAnswer = a;
            } else {
                question = `${a} + ? = ${result}`;
                console.log(`Question: ${question}`);
                correctAnswer = b;
            }
            break;
        }
    }

    if (correctAnswer === 0) {
        correctAnswer = evaluate(question);
        console.log(`correct answer: ${correctAnswer}`);
    }

    const options = [correctAnswer];
    while (options.length < 4) {
        const wrongAnswer = correctAnswer + getRandom(-15, 15);
        if (!options.includes(wrongAnswer)) {
            options.push(wrongAnswer);
        }
    }
    return {
        question,
        correctAnswer,
        options: shuffle(options)
    }
}

async function startMathBattle(interaction, playerMap, rounds = 5) {
    if (!interaction.deferred && !interaction.replied) {
        await interaction.deferReply();
    }

    const totalRounds = rounds;
    const roundDuration = 20 * 1000;
    const players = new Map();

    for (const [id, user] of playerMap) {
        players.set(id, { user, score: 0 });
    }

    for (let round = 0; round < totalRounds; round++) {
        const difficulty = ['easy', 'medium', 'hard', 'missing'][Math.floor(Math.random() * 4)];
        const { question, correctAnswer, options } = generateMathProblem(difficulty);

        const endTime = Date.now() + roundDuration;
        const createRoundEmbed = () => new EmbedBuilder()
            .setTitle(`Math Battle Round ${round + 1}/${totalRounds}`)
            .setDescription(`**Solve the math problem:**\n\n${question}`)
            .setColor(0x3498DB)
            .addFields(
                { name: 'Difficulty', value: difficulty, inline: true },
                { name: 'Time Remaining', value: `<t:${Math.floor(endTime / 1000)}:R>`, inline: true }
            )
            .setFooter({ text: `Round ${round + 1}/${totalRounds}` })
            .setTimestamp(endTime);

        const createAnswerEmbed = (correctAnswer) => new EmbedBuilder()
            .setTitle(`Math Battle Round ${round + 1}/${totalRounds} - Answer Revealed`)
            .setDescription(`**The correct answer was:** ${correctAnswer}`)
            .setColor(0x5865F2)
            .setFooter({ text: `Round ${round + 1}/${totalRounds}` });

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('math_battle_answer')
            .setPlaceholder('Select your answer')
            .addOptions(
                options.map((option, index) =>
                    new StringSelectMenuOptionBuilder()
                        .setLabel(option.toString())
                        .setValue(option.toString())
                )
            );

        const row = new ActionRowBuilder().addComponents(selectMenu);

        if (round === 0) {
            await interaction.editReply({
                content: `**Starting Math Battle!**\nTotal Rounds: ${totalRounds}`,
                embeds: [createRoundEmbed()],
                components: [row]
            });
        } else {
            await interaction.editReply({
                embeds: [createRoundEmbed()],
                components: [row]
            });
        }

        const roundMessage = await interaction.fetchReply();
        const filter = i => i.customId === 'math_battle_answer' && players.has(i.user.id);

        const collector = roundMessage.createMessageComponentCollector({
            filter,
            time: roundDuration
        });

        const userAnswers = new Map();
        collector.on('collect', async i => {
            if (!players.has(i.user.id)) {
                return i.reply({ content: 'You are not a participant in this Math Battle.', ephemeral: true });
            }

            userAnswers.set(i.user.id, parseFloat(i.values[0]));
        });

        await new Promise(resolve => collector.on('end', resolve));


        for (const [id, player] of players) {
            if (userAnswers.has(id)) {
                const answer = userAnswers.get(id);
                if (answer ===  correctAnswer) {
                    const scoreAmount = getPoints(difficulty);
                    player.score += scoreAmount;
                    await addXp(id, scoreAmount * 2);
                } else {
                    await addXp(id, 1);
                }
            }
        }

        const correctAnswerEmbed = createAnswerEmbed(correctAnswer);
        await roundMessage.edit({
            embeds: [correctAnswerEmbed],
            components: []
        });

        await new Promise(resolve => setTimeout(resolve, 5000));
    }

    const maxScore = Math.max(...Array.from(players.values()).map(player => player.score));
    for (const [id, player] of players) {
        const entry = await MathGameLeaderboard.findOneAndUpdate(
            { userId: id },
            {
                $inc: { score: player.score, gamesPlayed: 1 },
                username: player.user.username,
                lastUpdated: new Date()
            },
            { upsert: true, new: true }
        );

        if (player.score === maxScore && maxScore > 0) entry.gamesWon++;
        else entry.gamesLost++;

        await entry.save();

        const userData = await UserData.findOneAndUpdate(
            { userId: id },
            {
                $inc: { score: player.score, gamesPlayed: 1 },
                username: player.user.username,
                lastGameDate: new Date()
            },
            { upsert: true, new: true }
        );

        if (player.score === maxScore && maxScore > 0) userData.gamesWon++;
        else userData.gamesLost++;
        await userData.save();

        await addXp(id, 3);
    }

    const leaderboard = Array.from(players.entries())
        .sort((a, b) => b[1].score - a[1].score)
        .map(([id, player]) => `${player.user.username}: ${player.score} points`)
        .join('\n');

    const finalEmbed = new EmbedBuilder()
        .setTitle('Math Battle Over!')
        .setDescription(`**Final Scores:**\n${leaderboard}`)
        .setColor(0x2ECC71)
        .setFooter({ text: 'Thanks for playing!' })
        .setTimestamp();

    await interaction.editReply({
        embeds: [finalEmbed],
        components: []
    });

    return true;
}

module.exports = {
    startMathBattle,
    generateMathProblem
}

