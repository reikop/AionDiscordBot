const { Client, Intents } = require('discord.js');
const MessageRouter = require("./MessageRouter");
const Server = require("./worker/Server");
const Trim = require("./worker/Trim");
const Find = require("./worker/Find");
const DISCORD_KEY = process.env.DISCORD_TOKEN;

const client = new Client({ intents: [Intents.FLAGS.GUILDS] });

client.on('interactionCreate', interaction => {
    if (!interaction.isCommand()) return;

    const { commandName } = interaction;

    if (commandName === '!stats') {
        return interaction.reply(`Server count: ${client.guilds.cache.size}.`);
    }

    const router = new MessageRouter();
    router.registWorker("!서버", new Server());
    router.registWorker("!정리", new Trim(client));
    router.registWorker(["!누구", "!검색"], new Find());

});

client.login(DISCORD_KEY);