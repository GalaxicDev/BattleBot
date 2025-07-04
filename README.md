# BattleBot

BattleBot is a Discord bot featuring multiplayer trivia and GeoGuessr-style outline games. Challenge friends, join lobbies, and compete for the top spot!

## Features

- **Trivia Battle**: Multiplayer trivia with lobby and 1v1 challenge modes.
- **GeoGuess**: Guess the country from its outline, with smart multiple-choice options.
- **Discord Slash Commands**: Easy-to-use commands for all features.
- **MongoDB Integration**: Stores questions, game data, and more.

## Commands

- `/triviabattle start` — Start a public trivia lobby.
- `/triviabattle challenge <user>` — Challenge a user to a trivia duel.
- `/trivialeaderboard` — View the leaderboard to see who is the best trivia player.
- `/geoguess mode:<start|challenge> [user] [rounds]` — Play the GeoGuess outline game.
- `/geoguessleaderboard` — View the leaderboard to see who is the best geoguess player.

## Installation & Self-Hosting

### Prerequisites

- [Node.js](https://nodejs.org/) v20+
- [npm](https://www.npmjs.com/)
- [MongoDB](https://www.mongodb.com/) (local or remote)
- A Discord bot token ([guide](https://discord.com/developers/applications))

### 1. Clone the Repository
```
git clone https://github.com/yourusername/battlebot.git 
cd battlebot
```

### 2. Install Dependencies
```
npm install
```

### 3. Configure Environment Variables

Create a `.env` file in the root directory:

```
BOT_TOKEN=
CLIENT_ID=
MONGO_URI=
BOT_STATUS=
ACTIVITY_TYPE=
ACTIVITY_NAME=
```

### 4. Start the Bot
```
node main.js
```
The bot will connect to Discord and MongoDB, register commands, and set its status.

## Folder Structure

- `commands/` — Discord command handlers
- `games/` — Game logic
- `models/` — Mongoose models
- `utils/` — Utilities (GeoJSON, lobby managers, etc.)
- `utils/outlines/` — Generated country outline images

## Credits / About

- **Made with:**  
  - [Node.js](https://nodejs.org/), [Discord.js](https://discord.js.org/), [MongoDB](https://www.mongodb.com/), [canvas](https://www.npmjs.com/package/canvas), [d3-geo](https://github.com/d3/d3-geo), and more.

- **AI Assistance:**  
  - AI (GitHub Copilot and ChatGPT) was used to help generate code, design smart multiple-choice logic for GeoGuessr, and assist with documentation and code structure.

## License

This project is licensed under the MIT License.
