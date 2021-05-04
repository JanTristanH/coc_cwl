let fetch = require('node-fetch');
const {
    warToMaria
} = require('./mariaDriver');

const placeholder = '#';

const baseUrl = 'https://api.clashofclans.com/v1';
const endpointCurrentWarLeagueGroup = baseUrl + `/clans/${process.env.CLAN_TAG.replace('#', '%23')}/currentwar/leaguegroup`;
const endpointClanWarLeaguesWars = baseUrl + '/clanwarleagues/wars/';
const endpointClan = baseUrl + '/clans/' + placeholder
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
                    if (json.state !== "warEnded") {
                        //only count finished wars
                        resolve();
                    } else {
                        warToMaria(json);
                    };
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

//start
let start = () => {
    return new Promise((resolve, reject) => {
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
            .then(p => resolve({
                "status": "done"
            }))
            .catch(e => {
                resolve(e);
                console.log(e)
            });
    })
}
module.exports.start = start;

let fetchClanData = (clanTag) => {
    return new Promise((resolve, reject) => {
        clanTag = clanTag.replace('#', '%25');
        let url = endpointClan.replace(placeholder, clanTag);
        fetch(url, headers)
            .then(res => res.json())
            .then(json => {
                resolve(json);
            })
    })
}

let updateClans = () => {
    return new Promise((resolve, reject) => {
        let {
            getMissingClans,
            insertClanData
        } = require('./mariaDriver.js')
        getMissingClans()
            .then(rows => {

                rows.forEach(row => {
                    if (row.clanTag) {
                        fetchClanData(row.clanTag)
                            .then(clanData => {
                                insertClanData(clanData)
                                    .then(res => resolve(res));
                            });
                    }
                });
            });
    })
}

module.exports.updateClans = updateClans;