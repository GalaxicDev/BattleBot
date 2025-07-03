require('dotenv').config();

const { REST, Routes, Collection} = require('discord.js');
const fs = require('fs');
const path = require('path');

const deployCommands = async () => {
    try {
        const commands = [];

        const commandFiles = fs.readdirSync(path.join(__dirname, 'commands')).filter(file => file.endsWith('.js'));
        for (const file of commandFiles) {
            const command = require(path.join(__dirname, 'commands', file));
            if ('data' in command && 'execute' in command) {
                console.log(`Registering command: ${command.data.name}`);
                commands.push(command.data.toJSON());
            } else {
                console.warn(`The command at ${file} is missing a required "data" or "execute" property.`);
            }
        }

        const rest = new REST().setToken(process.env.BOT_TOKEN);

        console.log('Started refreshing application (/) commands.');

        const data = await rest.put(
            Routes.applicationCommands(process.env.CLIENT_ID),
            { body: commands },
        );

        console.log('Successfully registered application (/) commands.');
    } catch (error) {
        console.error('Error deploying commands:', error);
        throw error; // Re-throw the error to be caught in the main script
    }
}

const { Client, GatewayIntentBits, Partials, Collections, ActivityType, PresenceUpdateStatus, Events } = require('discord.js');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
    ],
    partials: [
        Partials.Channel,
        Partials.Message,
        Partials.Reaction,
    ],
})

client.commands = new Collection();

const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);

    if ('data' in command && 'execute' in command) {
        client.commands.set(command.data.name, command);
    } else {
        console.warn(`The command at ${filePath} is missing a required "data" or "execute" property.`);
    }
}

client.once(Events.ClientReady, async () => {
    console.log(`Logged in as ${client.user.tag}!`);

    await deployCommands();
    console.log('Commands deployed successfully!');

    const statusType = process.env.BOT_STATUS || 'online';
    const activityType = process.env.ACTIVITY_TYPE || 'PLAYING';
    const activityName = process.env.ACTIVITY_NAME || 'BattleBot by @GalaxicDev';

    const activityTypeMap = {
        'PLAYING': ActivityType.Playing,
        'WATCHING': ActivityType.Watching,
        'LISTENING': ActivityType.Listening,
        'COMPETING': ActivityType.Competing,
        'STREAMING': ActivityType.Streaming
    };

    const statusMap = {
        'online': PresenceUpdateStatus.Online,
        'idle': PresenceUpdateStatus.Idle,
        'dnd': PresenceUpdateStatus.DoNotDisturb,
        'invisible': PresenceUpdateStatus.Invisible
    };

    client.user.setPresence({
        status: statusMap[statusType],
        activities: [{
            name: activityName,
            type: activityTypeMap[activityType]
        }]
    });

    console.log(`Status set to ${statusType} with activity: ${activityName}`);
});

client.on(Events.InteractionCreate, async interaction => {
    if (!interaction.isCommand()) return;

    const command = client.commands.get(interaction.commandName);

    if (!command) {
        console.error(`No command matching ${interaction.commandName} was found.`);
        return;
    }

    try {
        await command.execute(interaction);
    } catch (error) {
        console.error(`Error executing command ${interaction.commandName}:`, error);
        if (interaction.replied || interaction.deferred) {
            await interaction.followUp({ content: 'There was an error while executing this command!', ephemeral: true });
        } else {
            await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
        }
    }
});

client.login(process.env.BOT_TOKEN);


