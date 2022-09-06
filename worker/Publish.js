import MessageWorker from "../MessageWorker.js";
import {PermissionsBitField} from "discord.js";

export default class Publish extends MessageWorker {
    /**
     *
     * @type {Client}
     */
    _client;
    /**
     *
     * @param client{Client}
     */
    constructor(client) {
        super();
        this._client = client;
    }

    /**
     *
     * @param interaction{ ChatInputCommandInteraction<CacheType> | MessageContextMenuCommandInteraction<CacheType> | UserContextMenuCommandInteraction<CacheType> | SelectMenuInteraction<CacheType> | ButtonInteraction<CacheType> | AutocompleteInteraction<CacheType> | ModalSubmitInteraction<CacheType>}
     */
    async receiveInteraction(interaction) {
        const message = interaction.options.getString("할말");
        let sended = 0;
        this._client.guilds.cache.forEach(guild => {
            const channel = guild.channels.cache.find(c => c.type === 0 && c.permissionsFor(this._client.user?.id).has(PermissionsBitField.Flags.SendMessages));
            if(channel){
                channel.send(message).then(() => sended++).catch(e => {})
            }
        });
        interaction.reply(`실행 완료`);
    }
}