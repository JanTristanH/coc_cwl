require('dotenv').config();
let fetch = require('node-fetch');
const fs = require('fs');
const filePath = "results/results.json";
const {warToMaria} = require('./mariaDriver');

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

const handleWar = (war) => {
    return new Promise((resolve, reject) => {
        if (war == "#0") {
            resolve();
        } else {
            fetch(endpointClanWarLeaguesWars + war.replace('#', '%25'), headers)
                .then(res => res.json())
                .then(json => {
                    warToMaria(json);
                    resolve();
                })
        }
    })
};

const handleRound = (round) => {
    return new Promise((resolve, reject) => {
        Promise.all(round.warTags.map(e => handleWar(e))).then(() => {
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

        return new Promise((resolve, reject) => {
            Promise.all(rounds.map(e => handleRound(e))).then(() => resolve());
        });
    })
    .catch(e => console.log(e));