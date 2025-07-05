# BattleBot

BattleBot is a Discord bot featuring multiplayer trivia and GeoGuessr-style outline games. Challenge friends, join lobbies, and compete for the top spot!

## Features

- **Trivia Battle**: Multiplayer trivia with lobby and 1v1 challenge modes.
- **GeoGuess**: Guess the country from its outline, with smart multiple-choice options.
- **Math Battle**: Battle with friends over math equations to prove who is the real nerd.
- **XP System**: Gain XP every time you play a game and answer a question to level up.
- **MongoDB Integration**: Stores questions, game data, and more.

## Commands

- `/triviabattle mode:<start|challenge> [user] [rounds]` — Play the Trivia game.
- `/trivialeaderboard` — View the leaderboard to see who is the best Trivia player.
- `/geoguess mode:<start|challenge> [user] [rounds]` — Play the GeoGuess outline game.
- `/geoguessleaderboard` — View the leaderboard to see who is the best Geoguess player.
- `/mathbattle mode:<start|challenge> [user] [rounds]` — Play the Math game.
- `/level [user]` — View yours or other people's level & XP.
- `/levelleaderboard` — View the level leaderboard to see who got the most XP.

## Invite bot hosted by me
```
https://discord.com/oauth2/authorize?client_id=1390363268781965362&permissions=68608&integration_type=0&scope=bot
```

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
### 4. Seed the trivia questions
```
node seedTrivia.js
```
 
### 5. Start the Bot
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
