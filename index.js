import {ShardingManager} from "discord.js";
import ServerUtils from "./ServerUtils.js";
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const DISCORD_KEY = process.env.DISCORD_TOKEN;
const manager = new ShardingManager('./bot.js', { token:DISCORD_KEY});

    manager.on('shardCreate', shard => console.log(`Launched shard ${shard.id}`));
    manager.spawn();