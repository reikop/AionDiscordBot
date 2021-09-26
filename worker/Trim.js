import MessageWorker from "../MessageWorker.js";
import _ from "lodash";
import Discord from "discord.js";

export default class Server extends MessageWorker {
    constructor(client) {
        super();
        this.client = client;
    }

    _client;
    get client() {
        return this._client;
    }
    set client(value) {
        this._client = value;
    }

    async receiveMessage(msg) {
        if(msg.author.id === '366297167247310860'){
            await msg.channel.send({embeds: [
                    new Discord.MessageEmbed()
                        .setColor("GOLD")
                        .setDescription("미사용 계정을 정리 합니다.")
                ]});
            this.clearUnusedServer().then()

        }else{
            await msg.channel.send({embeds: [
                    new Discord.MessageEmbed()
                        .setColor("GOLD")
                        .setDescription("개발자 전용 명령어 입니다.")
                ]});
        }
    }
    async clearUnusedServer() {
        const response = await this.api.get(`https://reikop.com:8081/api/server`)
        const servers = [];
        const leaveServers = [];
        this.client.channels.cache.forEach(channel => {
            const exists = _.find(response.data, {guild_id: channel.id});
            if (exists) {
                if (!servers.includes(channel.guild.id)) {
                    servers.push(channel.guild.id)
                }
            } else {
                if (!leaveServers.includes(channel.guild.id)) {
                    leaveServers.push(channel.guild.id)
                }
            }
        });
        const target = _.difference(leaveServers, servers);
        target.forEach(id => {
            this.client.guilds.cache.get(id).leave().then(e => {
            });
        })
    };

}