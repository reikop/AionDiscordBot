const axios = require('axios');
const Discord = require('discord.js');
const client = new Discord.Client();
const _ = require("lodash");
const numeral = require('numeral');
const DISCORD_KEY = require('fs').readFileSync('../cert/DISCORD_KEY.txt', 'utf8');

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const servers = [
    // {id: 1, name: "가디언", type: "GUARDIAN"},
    // {id: 2, name: "아칸", type: "ARKAN"},
    {id: 21, name: "이스라펠", type: "ISRAFEL"},
    {id: 22, name: "네자칸", type: "NEZAKAN"},
    {id: 23, name: "지켈", type: "ZICKEL"},
    {id: 24, name: "바이젤", type: "BYZEL"},
    {id: 25, name: "트리니엘", type: "TRINIEL"},
    {id: 26, name: "카이시넬", type: "KAISINEL"},
    {id: 27, name: "루미엘", type: "LUMIEL"},
]
const abyssItem = {
    'TEN': { //십부
        ARMOR: { SHIELD: 4, HEAD: 1.6, SHOULDER: 2.4, FOOT: 2.4, TORSO:4, LEG: 3.2, HAND: 2.4 },
        ACCESSORY: { FINGER: 1.6, WAIST: 1.6, EAR: 2.4, NECK:3.2 },
        WEAPON: { BOTH: 8, RIGHT: 4.8 },
    },
    'HUN': { //백부
        ARMOR: { SHIELD: 4.5, HEAD: 1.8, SHOULDER: 2.7, FOOT: 2.7, TORSO:4.5, LEG: 3.6, HAND: 2.7 },
        ACCESSORY: { FINGER: 1.8, WAIST: 1.8, EAR: 2.7, NECK:3.6 },
        WEAPON: { BOTH: 9, RIGHT: 5.4 }
    },
    'THO': { //천부
        ARMOR: { SHIELD: 5, HEAD: 2, SHOULDER: 3, FOOT: 3, TORSO:5, LEG: 4, HAND: 3 },
        ACCESSORY: { FINGER: 2, WAIST: 2, EAR: 3, NECK:4 },
        WEAPON: { BOTH: 10, RIGHT: 6 }
    },
}
const api = axios.create({
    baseURL : 'https://reikop.com:8081',
});

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
});

client.on('message', async msg => {
    if(msg.content.startsWith("!서버")){
        const guildId = msg.channel.id;
        const content = msg.content.split(" ");
        const servername = content[1];
        if(servername){
            const server = _.find(servers, {name:servername});
            if(server){
                const params = new URLSearchParams();
                params.append('server', server.type);
                await api.patch("/api/server/"+guildId, params);

                await msg.channel.send(new Discord.MessageEmbed()
                    .setColor("BLUE")
                    .setTitle(servername+"서버가 지정되었습니다.")
                    .setDescription("앞으로 "+servername+'서버에서 검색을 진행합니다.'))
            }else {
                await msg.channel.send(new Discord.MessageEmbed()
                    .setColor("YELLOW")
                    .setTitle("정확한 이름을 작성해주세요")
                    .addField("서버 목록", servers.map(s => s.name))
                )
            }
        }else{
            const server = await findServer(guildId);
            if(server){
                await msg.channel.send(new Discord.MessageEmbed()
                    .setColor("YELLOW")
                    .setTitle(`설정된 서버는 ${server.name}입니다.`))
            }else{
                await msg.channel.send(new Discord.MessageEmbed()
                    .setColor("YELLOW")
                    .setTitle(`설정된 서버가 없습니다.`))
            }
        }
    }
    //console.info(msg.guild.name, msg.author.username, msg.content);
    if(msg.content.startsWith("!누구 ") || msg.content.startsWith("!검색 ")){
        const content = msg.content.split(" ");
        const nickname = content[1];
        const servername = content[2];
        let server;
        if(servername == null) {
            server = await findServer(msg.channel.id);
            if(server == null){
                await msg.channel.send(new Discord.MessageEmbed()
                    .setTitle(`설정된 서버가 없습니다.`)
                    .setColor("RED")
                    .addField("서버 확인 방법", "!서버")
                    .addField("서버 설정 방법", "!서버 서버이름")
                    .addField("서버 목록", servers.map(s => s.name)));
                return;
            }
        }else{
            server = _.find(servers, {name:servername});
            if(server == null){
                await msg.channel.send(new Discord.MessageEmbed()
                    .setColor("YELLOW")
                    .setTitle("정확한 이름을 작성해주세요")
                    .addField("서버 목록", servers.map(s => s.name))
                )
                return;
            }
        }

        let char = null;
        try{
            char = await findChar(server.type, nickname);
            const c = _.find(char, c => c.charname.toUpperCase() === nickname.toUpperCase());
            if(c != null){
                const stat = await findStat(c);
                await msg.channel.send(getStatus(c, stat));
            }else if(char != null){
                await msg.channel.send(new Discord.MessageEmbed()
                    .setTitle(`${nickname}님을 찾을수 없습니다.`)
                    .setColor("RED")
                    .addField('검색된 아이디', char.map(c => c.charname)));
            }else{
                await msg.channel.send(new Discord.MessageEmbed()
                    .setTitle(`${nickname}님을 찾을수 없습니다.`)
                    .setColor("RED"))
            }
        }catch (e) {
            let url;
            if(!char){
                url = `https://aion.plaync.com/search/characters/name?&query=${nickname}&serverId=${server.id}&site=aion&sort=level&world=classic`
            }else{
                const c = _.find(char, c => c.charname.toUpperCase() === nickname.toUpperCase());
                url = `https://aion.plaync.com/characters/server/${server.id}/id/${c.userid}/home`
            }
            await msg.channel.send(new Discord.MessageEmbed()
                .setColor("RED")
                .setURL(url)
                .setTitle("아이온 서버가 응답하지 않습니다.\n클릭하여 공홈에서 검색합니다."));

        }

    }
});


function getStatus(char, stat){
    const serverid = getOriginServerId(char.server);
    return new Discord.MessageEmbed()
        .setAuthor(` ${char.serverName} ${char.raceName} ${stat.character_abyss.rankName} ${char.className}`,
            null,
            `https://aion.plaync.com/characters/server/${serverid}/id/${char.userid}/home`)
        .setTitle(`Lv.${char.level} ${char.charname} ${char.guildName ? `<${char.guildName}>` : ''}`)
        .setColor("RANDOM")
        .setThumbnail(`https://profileimg.plaync.com/game_profile_images/aion/images?gameServerKey=${serverid}&charKey=${char.userid}`)
        .addField('주요 능력치', getStatList(char, stat).join("\n"), true)
        .addField("장착 스티그마", getStigmaList(char, stat).join("\n") || '장착된 스티그마가 없습니다.', true)
        .addField("장착 아이템", getItemList(char, stat).join("\n") || '장착된 아이템이 없습니다.')
        .setTimestamp()
        .setURL(`https://aion.plaync.com/characters/server/${serverid}/id/${char.userid}/home`)
}
function getStatList(char, stat){
    const totalStat = stat.character_stats.totalStat;
    const result = [];
    const {def, att} = calcAbyss(stat.character_equipments);

    result.push({name: '생명력', value: numeral(totalStat.hp).format('0,0'), inline: true})
    result.push({name: '마법저항', value: numeral(totalStat.magicResist).format('0,0'), inline: true, warn: totalStat.magicResist > 1760})
    if(totalStat.block > 2300){
        result.push({name: '방패방어', value: numeral(totalStat.block).format('0,0'), inline: true, warn: totalStat.block > 2600})
    }
    if(totalStat.dodge > 1900){
        result.push({name: '회피', value: numeral(totalStat.dodge).format('0,0'), inline: true, warn: totalStat.dodge > 2600})
    }
    if(classType(char.className) === 'P'){
        result.push({name: '공격력', value: numeral(totalStat.physicalRight).format('0,0'), inline: true })
        result.push({name: '명중', value: numeral(totalStat.accuracyRight).format('0,0'), inline: true })
        result.push({name: '물리 치명타', value: numeral(totalStat.criticalRight).format('0,0'), inline: true })
    }else if(classType(char.className) === 'M'){
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
function getStigmaList(char, stat){
    return stat.character_stigma.map(s => s.name);
}
function getItemList(char, stat){
    const sort = [0,17,1,18,3,11,12,4,5,2,10,6,7,8,9,16];
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
function classType(className){
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
async function findServer(guildId){
    const response = await api.get(`/api/server/${guildId}`);
    return _.find(servers, {'type': response.data.servers});
}
async function findStat({server, userid}){
    const stats = await api.post(`/api/character/${server}/${userid}`);
    return stats.data;
}
async function findChar(server, name){
    const params = new URLSearchParams();
    params.append('keyword', name);
    params.append('server', server);
    try{
        const {data} = await api.post(`/api/suggest`, params)
        if(data != null && data.length > 0){
            return data;
        }
    }catch (e) {
        // console.error('error', e)
        return {};
    }
}

function calcAbyss(equips){
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
            }
            const item = abyssItem[level];
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
        }
    }
    return {def, att}
}

function getOriginServerId(name){
    return _.find(servers, n => n.type === name).id;
}
client.login(DISCORD_KEY);
