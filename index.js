require('dotenv').config();
let fetch = require('node-fetch');
const fs = require('fs');

const baseUrl = 'https://api.clashofclans.com/v1';
process.env.CLAN_TAG.replace('#', '%23');
let endpointCurrentWarLeagueGroup = baseUrl + `/clans/${process.env.CLAN_TAG.replace('#', '%23')}/currentwar/leaguegroup`;
let endpointClanwarleaguesWars = baseUrl + '/clanwarleagues/wars/';

let members = new Map();

const meta = {
    'Accept-Encoding': 'gzip',
    'authorization': process.env.API_KEY,
    'Content-Type': 'application/json',
    'Accept': '*/*',
    'Connection': 'close',
    'User-Agent': 'node-fetch/1.0'
};

const testUrl = 'https://api.clashofclans.com/v1/locations';
let headers = {headers: meta};
fetch(endpointCurrentWarLeagueGroup, headers)
    .then(res => res.json())
    .then(json => {
        /*
                fs.writeFile('leaguegroup.json', JSON.stringify(json), (err) => {
                    if (err) throw err;
                    console.log('The file has been saved!');
                });

                 */

        json.rounds.map(round => round.warTags.map(e => {
//            console.log(endpointClanwarleaguesWars + e.replace('#', '%'));
            //console.log(endpointClanwarleaguesWars + e.replace('#', '%25'));
            fetch(endpointClanwarleaguesWars + e.replace('#', '%25'), headers)
                .then(res => res.json())
                .then(json => {
                    //console.log(json);
                    //console.log(json.clan.tag, '-----' , process.env.CLAN_TAG);

                    if (json.clan.tag == process.env.CLAN_TAG) {
                        json.clan.members.forEach(member => {
                            let stats;
                            if(members.has(member.tag)) {
                                stats = members.get(member.tag);
                            } else {
                                stats = {
                                    "name": member.name,
                                    "townhallLevel": member.townhallLevel,
                                    "participatantInWar" : 0,
                                    "attacks" : [],
                                    "bestOpponentAttacks": [],
                                    "mapPositions":[]
                                }
                            }
                            stats.participatantInWar++;
                            if(member.attacks){
                                stats.attacks.push(member.attacks[0]);
                            }
                            if(member.bestOpponentAttacks) {
                                stats.bestOpponentAttacks.push(member.bestOpponentAttack);
                            }
                            stats.mapPositions.push(member.mapPosition);
                            members.set(member.tag,stats)
                        })

                        fs.writeFile('results.json', JSON.stringify([ ...members.values()]), (err) => {
                            if (err) throw err;
                            console.log('The file has been saved!');
                        });
                        /*
                        */
                    }
                })
        }));

    });
