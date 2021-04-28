require('dotenv').config();
let fetch = require('node-fetch');
const fs = require('fs');
const reducer = (accumulator, currentValue) => accumulator + currentValue;
const filePath = "results/results.json";
//todo clarify stars is new stars

const baseUrl = 'https://api.clashofclans.com/v1';
const endpointCurrentWarLeagueGroup = baseUrl + `/clans/${process.env.CLAN_TAG.replace('#', '%23')}/currentwar/leaguegroup`;
const endpointClanWarLeaguesWars = baseUrl + '/clanwarleagues/wars/';

const meta = {
    'Accept-Encoding': 'gzip',
    'authorization': process.env.API_KEY,
    'Content-Type': 'application/json',
    'Accept': '*/*',
    'Connection': 'close',
    'User-Agent': 'node-fetch/1.0'
};

const headers = {
    headers: meta
};

const handleWar = (war, members) => {
    return new Promise((resolve, reject) => {
        if (war == "#0") {
            resolve();
        } else {
            fetch(endpointClanWarLeaguesWars + war.replace('#', '%25'), headers)
                .then(res => res.json())
                .then(json => {
                    console.log(JSON.stringify(json) +  "," );
                    resolve();
                })
        }
    })
};

const handleRound = (round, members) => {
    return new Promise((resolve, reject) => {
        Promise.all(round.warTags.map(e => handleWar(e, members))).then(() => {
            resolve()
        });
    });
}

const gerenateOutput = string => {
    fs.writeFile(filePath, string, (err) => {
        if (err) throw err;
        console.log('The file has been saved!');
    });
}

const mapToOrderedArray = map => {
    //let compare = (a, b) => a.netAverage > b.netAverage ? -1 : 1;
    let compare = (a, b) => a.netTotal > b.netTotal ? -1 : 1;
    console.log("]");
    return [...map.values()];//.sort(compare);
}

const enhanceMap = map => {
    map.forEach((value, key) => {
        value.totalOffensiveStars = value.attacks.map(e => e.stars).reduce(reducer, 0);
        value.totalDefensiveStars = value.bestOpponentAttacks.map(e => e.stars).reduce(reducer, 0);
        value.netTotal = value.totalOffensiveStars - value.totalDefensiveStars;
        value.attacksCount = value.attacks.length;
        value.defensesCount = value.bestOpponentAttacks.length;
        
        value.attackStarsAverage = value.totalOffensiveStars / value.participatantInWar;
        value.defenseStarsAverage = value.totalDefensiveStars / value.defensesCount;
        value.netAverage = value.attackStarsAverage - value.defenseStarsAverage;

        delete value.bestOpponentAttacks;
        delete value.attacks;
        delete value.mapPositions;
    })
    return map;
}
console.log("[");
//start
fetch(endpointCurrentWarLeagueGroup, headers)
    .then(res => res.json())
    .then(json => {
        return new Promise((resolve, reject) => {
            if (json.reason) {
                reject(JSON.stringify(json));
            }
            resolve(json);
        });
    })
    .then(json => json.rounds)
    .then(rounds => {
        const members = new Map();
        return new Promise((resolve, reject) => {
            Promise.all(rounds.map(e => handleRound(e, members))).then(() => resolve(members));
        });
    })
    //.then(map => enhanceMap(map))
    .then(map => mapToOrderedArray(map))
    //.then(s => gerenateOutput(JSON.stringify(s)))
    .catch(e => console.log(e));