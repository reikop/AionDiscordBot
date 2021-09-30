import MessageWorker from "../MessageWorker.js";
import Discord from "discord.js";
import numeral from "numeral";
import _ from "lodash";

import serverList from "../data/serverlist.js";
import abyssItems from "../data/abyssItems.js";
export default class Find extends MessageWorker{

    constructor() {
        super();
    }

async receiveMessage(msg) {
    const content = msg.content.split(" ");
    const nickname = content[1];
    const servername = content[2];
    let server;
    if (servername == null) {
        server = await this.findServer(msg.channel.id);
        if (server == null) {
            this.send(msg.channel,
                    new Discord.MessageEmbed()
                        .setTitle(`설정된 서버가 없습니다.`)
                        .setColor("RED")
                        .addField("서버 확인 방법", "!서버")
                        .addField("서버 설정 방법", "!서버 서버이름")
                        .addField("서버 목록", serverList.map(s => s.name).join("\n"))
                );
            return;
        }
    } else {
        server = _.find(serverList, {name: servername});
        if (server == null) {
            this.send(msg.channel, new Discord.MessageEmbed()
                .setColor("YELLOW")
                .setTitle("정확한 이름을 작성해주세요")
                .addField("서버 목록", serverList.map(s => s.name).join("\n")))
            return;
        }
    }

    let char = null;
    try {
        char = await this.findChar(server.id, nickname);
        const c = _.find(char, c => c.charName.replace(/(<([^>]+)>)/ig, "").toUpperCase() === nickname.toUpperCase());
        if (c != null) {
            c.charName = c.charName.replace(/(<([^>]+)>)/ig, "");
            const stat = await this.findStat(c);
            await msg.channel.send({embeds: [this.getStatus(c, stat)]});
        } else if (char != null) {
            this.send(msg.channel,
                    new Discord.MessageEmbed()
                        .setTitle(`${nickname}님을 찾을수 없습니다.`)
                        .setColor("RED")
                        .addField('검색된 아이디', char.map(c => c.charName).join("\n"))
                );
        } else {
            this.send(msg.channel,
                    new Discord.MessageEmbed()
                        .setTitle(`${nickname}님을 찾을수 없습니다.`)
                        .setColor("RED")
            )
        }
    } catch (e) {
        let url;
        if (!char) {
            url = `https://aion.plaync.com/search/characters/name?&query=${nickname}&serverId=${server.id}&site=aion&sort=level&world=classic`
        } else {
            const c = _.find(char, c => c.charName.toUpperCase() === nickname.toUpperCase());
            if(c){
                url = `https://aion.plaync.com/characters/server/${server.id}/id/${c.charId}/home`
            }else{
                url = `https://aion.plaync.com/search/characters/name?classId=&pageNo=1&pageSize=20&query=${nickname}=&serverId=${server.id}&sort=rank&world=classic`;
            }
        }
        this.send(msg.channel,
                new Discord.MessageEmbed()
                    .setColor("RED")
                    .setURL(url)
                    .setTitle("아이온 서버가 응답하지 않습니다.\n클릭하여 공홈에서 검색합니다.")
            );
    }

}

    getStatus(char, stat){
        const serverid = char.serverId;
        return new Discord.MessageEmbed()
            .setAuthor(` ${char.serverName} ${char.raceName} ${stat.character_abyss.rankName} ${char.className}`,
                null,
                `https://aion.plaync.com/characters/server/${serverid}/id/${char.charId}/home`)
            .setTitle(`Lv.${char.level} ${char.charName} ${char.legionName ? `<${char.legionName}>` : ''}`)
            .setColor("RANDOM")
            .setThumbnail(char.profileImg)
            .addField('주요 능력치', this.getStatList(char, stat).join("\n"), true)
            .addField("장착 스티그마", this.getStigmaList(char, stat).join("\n") || '장착된 스티그마가 없습니다.', true)
            .addField("장착 아이템", this.getItemList(char, stat).join("\n") || '장착된 아이템이 없습니다.')
            .setTimestamp()
            .setURL(`https://aion.plaync.com/characters/server/${serverid}/id/${char.charId}/home`)
    }
    getStatList(char, stat){
        const totalStat = stat.character_stats.totalStat;
        const result = [];
        const {def, att} = this.calcAbyss(stat.character_equipments);

        result.push({name: '생명력', value: numeral(totalStat.hp).format('0,0'), inline: true})
        result.push({name: '마법저항', value: numeral(totalStat.magicResist).format('0,0'), inline: true, warn: totalStat.magicResist > 1760})
        if(totalStat.block > 2300){
            result.push({name: '방패방어', value: numeral(totalStat.block).format('0,0'), inline: true, warn: totalStat.block > 2600})
        }
        if(totalStat.dodge > 1900){
            result.push({name: '회피', value: numeral(totalStat.dodge).format('0,0'), inline: true, warn: totalStat.dodge > 2600})
        }
        if(this.classType(char.className) === 'P'){
            result.push({name: '공격력', value: numeral(totalStat.physicalRight).format('0,0'), inline: true })
            result.push({name: '명중', value: numeral(totalStat.accuracyRight).format('0,0'), inline: true })
            result.push({name: '물리 치명타', value: numeral(totalStat.criticalRight).format('0,0'), inline: true })
        }else if(this.classType(char.className) === 'M'){
            result.push({name: '마법증폭', value: numeral(totalStat.magicalBoost).format('0,0'), inline: true, warn: totalStat.magicalBoost > 2500 })
            result.push({name: '마법 적중', value: numeral(totalStat.magicalAccuracy).format('0,0'), inline: true, warn: totalStat.magicalAccuracy > 1700 })
            result.push({name: '마법 치명타', value: numeral(totalStat.magicalCriticalRight).format('0,0'), inline: true, warn: totalStat.magicalCriticalRight > 100 })
        }

        result.push({name: 'PVP공격력', value: att.toFixed(1) + "%", inline: true})
        result.push({name: 'PVP방어력', value: def.toFixed(1) + "%", inline: true})

        result.push({name: '물치저항', value: numeral(totalStat.phyCriticalReduceRate).format('0,0'), inline: true})
        result.push({name: '물치방어', value: numeral(totalStat.phyCriticalDamageReduce).format('0,0'), inline: true})

        result.push({name: '전체킬수', value: numeral(stat.character_abyss.totalKillCount).format('0,0'), inline: true, warn: stat.character_abyss.totalKillCount > 20000})
        result.push({name: '어비스 포인트', value: numeral(stat.character_abyss.abyssPoint).format('0,0'), inline: true})
        return result.map(s => `${s.name} :  ${s.value}`);
    }
    getStigmaList(char, stat){
        return stat.character_stigma.map(s => s.name);
    }
    getItemList(char, stat){
        const sort = [0,17,1,18,3,11,12,4,5,2,10,6,7,8,9,16,15];
        const group = _.groupBy(stat.character_equipments, 'equipSlotType');
        return sort.map(idx => {
            if(group[idx]){
                const item = group[idx][0];
                return (item.enchantCount > 0 ? '+'+ item.enchantCount: '') + '\t'+item.name
            }else{
                return "";
            }
        }).filter(s => s.length > 0);
    }
    classType(className){
        switch (className) {
            case '마도성' :
            case '정령성' :
            case '치유성' :
                return 'M';
            case '검성' :
            case '살성' :
            case '궁성' :
            case '수호성' :
            case '호법성' :
                return 'P';
        }
        return 'P';
    }
    async findServer(guildId){
        const response = await this.api.get(`https://reikop.com:8081/api/server/${guildId}`);
        if(response && response.data){
            return _.find(serverList, {'type': response.data.servers});
        }else{
            return null;
        }
    }
    async findStat({serverId, charId}){
        const data = {"keyList":["character_stats","character_equipments","character_abyss","character_stigma"]};
        const response = await this.api.put(`https://api-aion.plaync.com/game/v2/classic/merge/server/${serverId}/id/${charId}`, data);
        // const stats = await api.post(`/api/character/${server}/${userid}`);
        return response.data;
    }
    async findChar(server, name){
        try{
            const {data} = await this.api.get(`https://api-aion.plaync.com/search/v1/characters?classId=&pageNo=1&pageSize=50&query=${encodeURIComponent(name)}&raceId=&serverId=${server}`);
            if(data != null && data.documents.length > 0){
                return data.documents;
            }
        }catch (e) {
            console.error('error', e)
            return [];
        }
    }

    calcAbyss(equips){
        let def = 0;
        let att = 0;
        for(const equip of equips){
            if( /(가디언|아칸)\s.부장/.test(equip.name)){
                const type = /(십|백|천|만)부/.exec(equip.name)[1];
                let level = 'TEN';
                switch(type){
                    case '십' :  level = 'TEN'; break;
                    case '백' :  level = 'HUN'; break;
                    case '천' :  level = 'THO'; break;
                    case '만' :  level = 'THU'; break;
                }
                const item = abyssItems[level];
                const category = [equip.category1.alias, equip.category2.alias, equip.category3.alias];
                if(category[0] === 'ACCESSORY'){
                    att += item[category[0]][category[1]];
                }else if(category[0] === 'ARMOR'){
                    if(category[1] === "HEAD"){
                        def += item[category[0]][category[1]];
                    }else if(category[1] === "SHIELD"){
                        def += item[category[0]][category[1]];
                    }else{
                        def += item[category[0]][category[2]];
                    }
                }else if(category[0] === 'WEAPON'){
                    let weaponType = 'BOTH';
                    switch (category[1]) {
                        case 'ORB' :
                        case 'BOOK' :
                        case 'TWOHANDSWORD' :
                        case 'STAFF' :
                        case 'BOW' :
                        case 'POLEARM' :
                            weaponType = 'BOTH'; break;
                        case 'MACE' :
                        case 'SWORD' :
                        case 'DAGGER' :
                            weaponType = 'RIGHT'; break;
                    }
                    att += item[category[0]][weaponType];
                }
            }else if(equip.name === '라크하네의 머리장식'){
                def += 2;
            }else if(equip.name.startsWith('뒤틀린 황천의')){
                def += 2;
            }else if(equip.name.startsWith('가디언 정찰대의')){
                def += 1.6;
            }
        }
        return {def, att}
    }


    send(channel, embed){
        try{
            return channel.send({embeds: [embed]})
        }catch (e) {
            console.info("MESSAGE SEND ERROR");
        }
    }
}