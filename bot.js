import {Client, GatewayIntentBits, SlashCommandBuilder, Routes} from "discord.js";
import { REST } from '@discordjs/rest';
import Server from "./worker/Server.js";
import Find from "./worker/Find.js";
import MessageRouter from "./MessageRouter.js";
import Publish from "./worker/Publish.js";
import ServerUtils from "./ServerUtils.js";
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const client = new Client({ intents: [GatewayIntentBits.Guilds] });
const DISCORD_KEY = process.env.DISCORD_TOKEN;
const DISCORD_ID = process.env.DISCORD_ID;
const router = new MessageRouter();

ServerUtils.init();

router.registWorker("서버",new Server());
router.registWorker(["누구", "검색"], new Find());
router.registWorker("발행", new Publish(client));
client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;
    router.receiveInteraction(interaction);
});
client.login(DISCORD_KEY);
const rest = new REST({ version: '10' }).setToken(DISCORD_KEY);
rest.put(
    Routes.applicationCommands(DISCORD_ID),
    { body: [
            new SlashCommandBuilder()
                .setName('서버')
                .setDescription('`/서버`로 현재 서버 확인을,`/서버 네자칸` 형식으로 앞으로 검색할 서버를 설정합니다.')
                .addStringOption(o => o
                    .setName("이름").setDescription('서버 이름').setRequired(false)),

            new SlashCommandBuilder()
                .setName('누구')
                .setDescription('`/누구 동매`, `/누구 동매 네자칸` 형식으로 사용자를 검색합니다.')
                .addStringOption(o => o.setName("케릭터").setDescription("검색할 케릭터 명, `TAB`키 누르고 서버 명").setRequired(true))
                .addStringOption(o => o.setName("서버").setDescription("(`네자칸`, `네`) 저장한 서버 대신 새로 검색할 서버 명").setRequired(false))
        ].map(n => n.toJSON()) },
);