import parser from "args-parser";
import Discord, {Intents} from "discord.js";
import Server from "./worker/Server.js";
import Find from "./worker/Find.js";
import Trim from "./worker/Trim.js";
import MessageRouter from "./MessageRouter.js";

process.on("uncaughtException", error => {
    console.info("ERROR", new Date().toLocaleString() , error)
})

const client = new Discord.Client({
    intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILD_VOICE_STATES]
});
const DISCORD_KEY = process.env.DISCORD_TOKEN;
const router = new MessageRouter();
router.registWorker("!서버", new Server());
router.registWorker("!정리", new Trim(client));
router.registWorker(["!누구", "!검색"], new Find());
// router.registWorker("*", new MusicPlayer(client));

client.on('message', async msg => router.receiveMessage(msg));
client.login(DISCORD_KEY);
