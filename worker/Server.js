import MessageWorker from "../MessageWorker.js";
import {EmbedBuilder, Embed} from "discord.js";
import ServerUtils from "../ServerUtils.js";
export default class Server extends MessageWorker{

    constructor() {
        super();
    }
    /**
     *
     * @param interaction{ ChatInputCommandInteraction<CacheType> | MessageContextMenuCommandInteraction<CacheType> | UserContextMenuCommandInteraction<CacheType> | SelectMenuInteraction<CacheType> | ButtonInteraction<CacheType> | AutocompleteInteraction<CacheType> | ModalSubmitInteraction<CacheType>}
     */
    async receiveInteraction(interaction) {
        const guildId = interaction.channelId;
        const servername = interaction.options.getString('이름');
        if (servername) {
            const server = ServerUtils.findServerByName(servername);
            if (server) {
                try{
                    await this.api.patch("https://reikop.io/api/server/" + guildId, null, {
                        params: {
                            server : server.serverId
                        }
                    });
                    await interaction.editReply({embeds: [new EmbedBuilder()
                            .setColor(0x0000ff)
                            .setTitle(servername + "서버가 지정되었습니다.")
                            .setDescription("앞으로 " + servername + '서버에서 검색을 진행합니다.')]})
                }catch (e) {
                    await interaction.editReply({embeds: [new EmbedBuilder()
                            .setColor(0xff0000)
                            .setTitle(servername + "서버 등록 중 오류가 발생 했습니다..")
                            .setDescription(e)]})
                }

            } else {
                const serverlist = ServerUtils.getServerList().map(s => s.serverName).join("\n");
                await interaction.editReply({embeds: [
                        new EmbedBuilder()
                            .setColor(0xffff00)
                            .setTitle("정확한 이름을 작성해주세요")
                            .addFields({name:"서버 목록", value: serverlist})
                    ]})
            }
        } else {
            const server = await this.findServer(guildId);
            if (server) {
                // console.info(interaction.editReply())
                await interaction.editReply({embeds: [new EmbedBuilder()
                        .setColor(0xffff00)
                        .setTitle(`설정된 서버는 ${server.serverName}입니다.`)]});
                // interaction.editReply(`설정된 서버는 ${server.name}입니다.`);
            } else {
                await interaction.editReply({
                    embeds: [new EmbedBuilder()
                        .setColor(0xffff00)
                        .setTitle(`설정된 서버가 없습니다.`)]
                });
                // interaction.editReply('설정된 서버가 없습니다.');
            }
        }
    }
    async findServer(guildId){
        const response = await this.api.get(`https://reikop.io/api/server/${guildId}`);
        if(response && response.data){
            return response.data
        }else{
            return null;
        }
    }



}