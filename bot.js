import {Client, GatewayIntentBits, SlashCommandBuilder, Routes} from "discord.js";
import { REST } from '@discordjs/rest';
import Server from "./worker/Server.js";
import Find from "./worker/Find.js";
import Trim from "./worker/Trim.js";
import MessageRouter from "./MessageRouter.js";
import Publish from "./worker/Publish.js";
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

//
// process.on("uncaughtException", error => {
//     console.info("ERROR", new Date().toLocaleString() , error)
// })

const client = new Client({ intents: [GatewayIntentBits.Guilds] });
const DISCORD_KEY = process.env.DISCORD_TOKEN;


const router = new MessageRouter();
router.registWorker("서버",new Server());
router.registWorker(["누구", "검색"], new Find());
router.registWorker("발행", new Publish(client));
// router.registWorker("!정리", new Trim(client));
// router.registWorker("*", new MusicPlayer(client));
// client.on('message', async msg => router.receiveMessage(msg));
client.on('interactionCreate', async interaction => {
    // console.info(interaction.commandName, interaction.options.get("케릭터"))
    if (!interaction.isChatInputCommand()) return;
    router.receiveInteraction(interaction);
});
client.login(DISCORD_KEY);
const rest = new REST({ version: '10' }).setToken(DISCORD_KEY);
rest.put(
    Routes.applicationCommands('841190119355842630'),
    // Routes.applicationCommands('828894960304128025'),
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
// rest.put(
//     Routes.applicationGuildCommands('841190119355842630', '386195373326204948'),
//     // Routes.applicationGuildCommands('828894960304128025', '386195373326204948'),
//     { body: [
//             new SlashCommandBuilder()
//                 .setName('발행')
//                 .setDescription('전체 메시지 발송')
//                 .addStringOption(o => o
//                     .setName("할말").setDescription('머라할뀨 전체말임').setRequired(true))
//         ].map(n => n.toJSON()) },
// );