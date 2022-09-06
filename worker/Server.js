import MessageWorker from "../MessageWorker.js";
import {EmbedBuilder, Embed} from "discord.js";
import {ServerUtils} from "aion-classic-lib";
export default class Server extends MessageWorker{

    constructor() {
        super();
    }
    /**
     *
     * @param interaction{ ChatInputCommandInteraction<CacheType> | MessageContextMenuCommandInteraction<CacheType> | UserContextMenuCommandInteraction<CacheType> | SelectMenuInteraction<CacheType> | ButtonInteraction<CacheType> | AutocompleteInteraction<CacheType> | ModalSubmitInteraction<CacheType>}
     */
    async receiveInteraction(interaction) {
        const guildId = interaction.guildId;
        const servername = interaction.options.getString('이름');
        if (servername) {
            const server = ServerUtils.findServerByName(servername);
            if (server) {
                const params = new URLSearchParams();
                params.append('server', server.type);
                try{
                    await this.api.patch("https://reikop.com:8081/api/server/" + guildId, params);
                    await interaction.channel.send({embeds: [new EmbedBuilder()
                            .setColor(0x0000ff)
                            .setTitle(servername + "서버가 지정되었습니다.")
                            .setDescription("앞으로 " + servername + '서버에서 검색을 진행합니다.')]})
                }catch (e) {
                    await interaction.channel.send({embeds: [new EmbedBuilder()
                            .setColor(0xff0000)
                            .setTitle(servername + "서버 등록 중 오류가 발생 했습니다..")
                            .setDescription(e)]})
                }

            } else {
                await interaction.channel.send({embeds: [
                        new EmbedBuilder()
                            .setColor(0xffff00)
                            .setTitle("정확한 이름을 작성해주세요")
                            .addField("서버 목록", ServerUtils.getServerList().map(s => s.name).join("\n"))
                    ]})
            }
        } else {
            const server = await this.findServer(guildId);
            if (server) {
                await interaction.channel.send({embeds: [new EmbedBuilder()
                        .setColor(0xffff00)
                        .setTitle(`설정된 서버는 ${server.name}입니다.`)]});
                interaction.reply(`설정된 서버는 ${server.name}입니다.`);
            } else {
                await interaction.channel.send({
                    embeds: [new EmbedBuilder()
                        .setColor(0xffff00)
                        .setTitle(`설정된 서버가 없습니다.`)]
                });
                interaction.reply('설정된 서버가 없습니다.');
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