import parser from "args-parser";
import Discord from "discord.js";
import Server from "./worker/Server.js";
import Find from "./worker/Find.js";
import MessageRouter from "./MessageRouter.js";

const client = new Discord.Client();
const args = parser(process.argv);
const DISCORD_KEY = args.key;

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';


const router = new MessageRouter(client);
router.registWorker("!서버", new Server());
router.registWorker(["!누구", "!검색"], new Find());

client.on('message', async msg => router.receiveMessage(msg));
client.login(DISCORD_KEY);
