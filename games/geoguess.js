const {
    ActionRowBuilder,
    EmbedBuilder,
    StringSelectMenuBuilder,
    StringSelectMenuOptionBuilder
} = require('discord.js');

const GeoGuessQuestion = require('../models/geoGuessModel');
const GeoGuessLeaderboard = require('../models/geoGuessLeaderboard');

const UserData = require('../models/userData');
const { addXp } = require("../utils/xpHandler");

function shuffle(array) {
    return array.sort(() => Math.random() - 0.5);
}


async function startGeoGuessGame(interaction, playersMap, rounds = 5) {
    if (!interaction.deferred && !interaction.replied) {
        await interaction.deferReply();
    }

    const totalRounds = rounds;
    const roundDuration = 25 * 1000; // 30 seconds per round
    const players = new Map();

    for (const [id, user] of playersMap) {
        players.set(id, { user, score: 0 });
    }

    for (let round = 0; round < totalRounds; round++) {

        const questionData = await GeoGuessQuestion.findOne( ).skip(Math.floor(Math.random() * await GeoGuessQuestion.countDocuments()));
        const image_path = `https://battlebotcdn.netlify.app/${questionData.image}`; // Assuming questionData.image is the path to the image
        const allAnswers = shuffle(questionData.options);

        console.log(questionData);
        console.log(`Correct Answer: ${questionData.correctAnswer}`);

        if (!image_path) {
            await interaction.editReply({ content: 'No image found for this question. Please try again later.' });
            return;
        }


        const endTime = Date.now() + roundDuration;
        // Create the round embed with image from utils/outlines/{questionData.image}
        const createRoundEmbed = () => new EmbedBuilder()
            .setTitle(`GeoGuess Round ${round + 1}/${totalRounds}`)
            .setDescription(`**Guess the location!**\n\nYou have **${Math.floor(roundDuration / 1000)} seconds** to guess.`)
            .setImage(image_path)
            .setColor(0x3498DB)
            .addFields(
                { name: 'Time Remaining', value: `<t:${Math.floor(endTime / 1000)}:R>`, inline: true }
            )
            .setFooter({ text: `Round ${round + 1}/${totalRounds}` })
            .setTimestamp(endTime);

        const createAnswerEmbed = (correctAnswer) => new EmbedBuilder()
            .setTitle(`GeoGuess Round ${round + 1}/${totalRounds} - Answer Revealed`)
            .setDescription(`**The correct location was:** ${correctAnswer}\n\nYou can view the location on the map.`)
            .setColor(0x5865F2)
            .setImage(image_path)
            .setFooter({ text: `Round ${round + 1}/${totalRounds}` });

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId(`geoguess_${round}`)
            .setPlaceholder('Select your guess')
            .addOptions(
                allAnswers.map(answer =>
                    new StringSelectMenuOptionBuilder()
                        .setLabel(answer)
                        .setValue(answer)
                )
            );

        const row = new ActionRowBuilder().addComponents(selectMenu);

        if (round === 0) {
            await interaction.editReply({
                content: `**Starting GeoGuess Game!**\nTotal Rounds: ${totalRounds}`,
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
        const filter = i => i.customId === `geoguess_${round}` && players.has(i.user.id);
        const collector = roundMessage.createMessageComponentCollector({
            filter,
            time: roundDuration
        });
        const userAnswers = new Map();
        collector.on('collect', async i => {
            if (!players.has(i.user.id)) {
                return i.reply({ content: 'You are not a participant in this GeoGuess game.', ephemeral: true });
            }

            userAnswers.set(i.user.id, i.values[0]);
        });

        await new Promise(resolve => collector.on('end', resolve));

        // check if the user has answered correctly and update their score
        for (const [id, player] of players) {
            if (userAnswers.has(id)) {
                const answer = userAnswers.get(id);
                if (answer === questionData.correctAnswer) {
                    player.score += 1;
                    await addXp(id, 5);
                } else {
                    await addXp(id, 1);
                }
            }
        }

        // Show the correct answer after round ends
        const correctAnswerEmbed = createAnswerEmbed(questionData.correctAnswer);
        await roundMessage.edit({
            embeds: [correctAnswerEmbed],
            components: []
        });

        await new Promise(resolve => setTimeout(resolve, 5000)); // Wait for 5 seconds before next round
    }

    const maxScore = Math.max(...Array.from(players.values()).map(player => player.score));
    for (const [id, player] of players) {
        const entry = await GeoGuessLeaderboard.findOneAndUpdate(
            { userId: id },
            {
                $inc: { score: player.score, gamesPlayed: 1 },
                username: player.user.username,
                lastUpdated: new Date()
            },
            { upsert: true, new: true }
        );

        if (player.score === maxScore && maxScore > 0) entry.gamesWon++;
        else entry.gamesLost--;

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

    // Final leaderboard
    const leaderboard = Array.from(players.entries())
        .sort((a, b) => b[1].score - a[1].score)
        .map(([id, player]) => `${player.user.username}: ${player.score} points`)
        .join('\n');
    const finalEmbed = new EmbedBuilder()
        .setTitle('GeoGuess Game Over!')
        .setDescription(`**Final Scores:**\n${leaderboard}`)
        .setColor(0x2ECC71)
        .setFooter({ text: 'Thanks for playing!' })
        .setTimestamp();
    await interaction.editReply({
        embeds: [finalEmbed],
        components: []
    });

    return true
}

module.exports = {
    startGeoGuessGame
}

