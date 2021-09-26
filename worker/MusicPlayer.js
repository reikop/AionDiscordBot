import MessageWorker from "../MessageWorker.js";
import {Player, RepeatMode} from "discord-music-player";
import Discord from "discord.js";

export default class MusicPlayer extends MessageWorker {


    constructor(client) {
        super();
        this._player = new Player(client);
        this._client = client;
    }
    _client
    _player;
    get player() {
        return this._player;
    }


    updateSong(message, song){

        // message.channel.send({embeds: [
        //         new Discord.MessageEmbed()
        //             .setColor("LUMINOUS_VIVID_PINK")
        //             .setTitle(`[${song.duration}] - ${song.name}`)
        //             .setImage(song.thumbnail)
        //             .setURL(song.url)
        //     ]});
    }

    async addMusicServer({guildId, id}){

    }

    async receiveMessage(message) {

        const args = message.content.slice("!").trim().split(/ +/g);
        const command = args.shift();
        console.info(command, args)
        let guildQueue = this.player.getQueue(message.guild.id);
        if(command === "!설치"){
            const channel = await message.guild.channels.create("노래하는-코노슝", {type: 'GUILD_TEXT'});
            await this.addMusicServer(channel);
        }else if (command === 'play') {
            let queue = this.player.createQueue(message.guild.id);
            queue.join(message.member.voice.channel).then(async c => {
                queue.play(args.join(' ')).then(song => {

                    this.updateSong(message, song)

                }).catch(_ => {
                    if (!guildQueue)
                        queue.stop();
                });
            }).catch(e => {
                console.error(e);
            })
        }

        if (command === 'playlist') {
            let queue = this.player.createQueue(message.guild.id);
            await queue.join(message.member.voice.channel);
            let song = await queue.playlist(args.join(' ')).catch(_ => {
                if (!guildQueue)
                    queue.stop();
            });
        }

        if (command === 'skip') {
            guildQueue.skip();
        }

        if (command === 'stop') {
            guildQueue.stop();
        }

        if (command === 'removeLoop') {
            guildQueue.setRepeatMode(RepeatMode.DISABLED); // or 0 instead of RepeatMode.DISABLED
        }

        if (command === 'toggleLoop') {
            guildQueue.setRepeatMode(RepeatMode.SONG); // or 1 instead of RepeatMode.SONG
        }

        if (command === 'toggleQueueLoop') {
            guildQueue.setRepeatMode(RepeatMode.QUEUE); // or 2 instead of RepeatMode.QUEUE
        }

        if (command === 'setVolume') {
            guildQueue.setVolume(parseInt(args[0]));
        }

        if (command === 'seek') {
            guildQueue.seek(parseInt(args[0]) * 1000);
        }

        if (command === 'clearQueue') {
            guildQueue.clearQueue();
        }

        if (command === 'shuffle') {
            guildQueue.shuffle();
        }

        if (command === 'getQueue') {
            console.log(guildQueue);
        }

        if (command === 'getVolume') {
            console.log(guildQueue.volume)
        }

        if (command === 'nowPlaying') {
            console.log(`Now playing: ${guildQueue.nowPlaying}`);
        }

        if (command === 'pause') {
            guildQueue.setPaused(true);
        }

        if (command === 'resume') {
            guildQueue.setPaused(false);
        }

        if (command === 'remove') {
            guildQueue.remove(parseInt(args[0]));
        }

        if (command === 'createProgressBar') {
            const ProgressBar = guildQueue.createProgressBar();

            // [======>              ][00:35/2:20]
            console.log(ProgressBar.prettier);
        }
    }






}