require('dotenv').config();
let fetch = require('node-fetch');
const fs = require('fs');
const reducer = (accumulator, currentValue) => accumulator + currentValue;

const baseUrl = 'https://api.clashofclans.com/v1';
const endpointCurrentWarLeagueGroup = baseUrl + `/clans/${process.env.CLAN_TAG.replace('#', '%23')}/currentwar/leaguegroup`;
const endpointClanWarLeaguesWars = baseUrl + '/clanwarleagues/wars/';

const members = new Map();

const meta = {
    'Accept-Encoding': 'gzip',
    'authorization': process.env.API_KEY,
    'Content-Type': 'application/json',
    'Accept': '*/*',
    'Connection': 'close',
    'User-Agent': 'node-fetch/1.0'
};

const headers = {headers: meta};

const handleWar = war => {
    return new Promise((resolve, reject) => {
        fetch(endpointClanWarLeaguesWars + war.replace('#', '%25'), headers)
            .then(res => res.json())
            .then(json => {
                if (json.clan.tag == process.env.CLAN_TAG) {
                    json.clan.members.forEach(member => {
                        let stats;
                        if (members.has(member.tag)) {
                            stats = members.get(member.tag);
                        } else {
                            stats = {
                                "name": member.name,
                                "townhallLevel": member.townhallLevel,
                                "participatantInWar": 0,
                                "attacks": [],
                                "bestOpponentAttacks": [],
                                "mapPositions": []
                            }
                        }
                        stats.participatantInWar++;
                        if (member.attacks) {
                            //check if target was attacked more than once
                            if (json.opponent.members.filter(e => e.tag === member.attacks[0].defenderTag)[0].opponentAttacks > 1) {
                                //check who also attacked it
                                let earlierAttackers = json.clan.members.filter(m => {
                                    if (m.attacks) {
                                        return m.attacks[0].defenderTag == member.attacks[0].defenderTag
                                            && m.attacks[0].order < member.attacks[0].order
                                    }
                                    return false
                                });
                                let compare = (a, b) => a.stars > b.stars ? -1 : 1;
                                earlierAttackers.sort(compare);
                                //console.log("hiiii");
                                member.attacks[0].stars = member.attacks[0].stars -
                                    (earlierAttackers[0] ? earlierAttackers[0].attacks[0].stars : 0);
                            }
                            stats.attacks.push(member.attacks[0]);
                        }
                        if (member.bestOpponentAttack) {
                            stats.bestOpponentAttacks.push(member.bestOpponentAttack);
                        }
                        stats.mapPositions.push(member.mapPosition);
                        members.set(member.tag, stats)
                    })
                }
                resolve();
            })
    })
};

const handleRound = round => {
    return new Promise((resolve, reject) => {
        Promise.all(round.warTags.map(handleWar)).then(() => resolve());
    });
}

const gerenateOutput = string => {
    fs.writeFile('results.json', string, (err) => {
        if (err) throw err;
        console.log('The file has been saved!');
    });
}

const mapToOrderedArray = map => {
    let compare = ( a, b ) => a.netTotal > b.netTotal ? -1 : 1;
    return [...map.values()].sort(compare);
}

const enhanceMap = map => {
    map.forEach((value, key) => {
        value.totalOffensiveStars = value.attacks.map(e => e.stars).reduce(reducer, 0);
        value.totalDefensiveStars = value.bestOpponentAttacks.map(e => e.stars).reduce(reducer, 0);
        value.netTotal = value.totalOffensiveStars - value.totalDefensiveStars;
        //delete value.bestOpponentAttacks;
        //delete value.attacks;
        //delete value.mapPositions;
    })
    return map;
}


//start
fetch(endpointCurrentWarLeagueGroup, headers)
    .then(res => res.json())
    .then(json => json.rounds)
    .then(rounds => {
        return new Promise((resolve, reject) => {
            Promise.all(rounds.map(handleRound)).then(() => resolve(members));
        });
    })
    .then(map => enhanceMap(map))
    .then(map => mapToOrderedArray(map))
    .then(s => gerenateOutput(JSON.stringify(s)))
    .catch(e => console.log(e));