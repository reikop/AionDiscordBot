import MessageWorker from "../MessageWorker.js";
import Discord from "discord.js";
import {ServerUtils} from "aion-classic-lib";
export default class Server extends MessageWorker{

    constructor() {
        super();
    }

    async receiveMessage(msg) {
        const guildId = msg.channel.id;
        const content = msg.content.split(" ");
        const servername = content[1];
        if (servername) {
            const server = ServerUtils.findServerByName(servername);
            if (server) {
                const params = new URLSearchParams();
                params.append('server', server.type);
                try{
                    await this.api.patch("https://reikop.com:8081/api/server/" + guildId, params);
                    await msg.channel.send({embeds: [new Discord.MessageEmbed()
                        .setColor("BLUE")
                        .setTitle(servername + "서버가 지정되었습니다.")
                        .setDescription("앞으로 " + servername + '서버에서 검색을 진행합니다.')]})
                }catch (e) {
                    await msg.channel.send({embeds: [new Discord.MessageEmbed()
                        .setColor("RED")
                        .setTitle(servername + "서버 등록 중 오류가 발생 했습니다..")
                        .setDescription(e)]})
                }




            } else {
                await msg.channel.send({embeds: [
                        new Discord.MessageEmbed()
                            .setColor("YELLOW")
                            .setTitle("정확한 이름을 작성해주세요")
                            .addField("서버 목록", ServerUtils.getServerList().map(s => s.name).join("\n"))
                    ]})
            }
        } else {
            const server = await this.findServer(guildId);
            if (server) {
                await msg.channel.send({embeds: [new Discord.MessageEmbed()
                    .setColor("YELLOW")
                    .setTitle(`설정된 서버는 ${server.name}입니다.`)]});
            } else {
                await msg.channel.send({
                    embeds: [new Discord.MessageEmbed()
                        .setColor("YELLOW")
                        .setTitle(`설정된 서버가 없습니다.`)]
                    })
                }
            }
    }

    async findServer(guildId){
        const response = await this.api.get(`https://reikop.com:8081/api/server/${guildId}`);
        if(response && response.data){
            return ServerUtils.findServerById(response.data.servers);
        }else{
            return null;
        }

    }

}