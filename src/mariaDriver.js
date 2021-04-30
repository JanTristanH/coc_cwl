const e = require('express');
const mariadb = require('mariadb');
const database = "clash_of_clans";
if (!process.env.DB_HOST) {
    require('dotenv').config();
}
const pool = mariadb.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
    database: database,
    connectionLimit: 5
});

const sqlTrue = 1;
const sqlFalse = 0;
const noId = "#0";
const isWarLeagueAttack = sqlTrue;
const clanTableName = 'clan';
const clanTableKey = 'tag';
const attackTableClanTagField = 'clanTag';

const attackTableName = "attack";
const fieldListAttackTable = "attackerTag,month,defenderTag,defenderClanTag,duration,destructionPercentage,year,clanTag,stars,newStars,attackerTownHallLevel,attackOrder,defenderTownHallLevel,attackerName,defenderName,isFinalDefensiveScore,isWarLeagueAttack,attckerMapPosition";
const fieldListClanTable = 'tag,name,warLeague_name,warLeague_id, clanVersusPoints, requiredTrophies, requiredVersusTrophies, requiredTownhallLevel, isWarLogPublic, clanLevel, warFrequency, warWinStreak, warWins, warTies, warLosses, clanPoints, chatLanguageId, chatLanguageName, chatLanguageLanguageCode, labelOneName, labelOneId, labelTwoName, labelTwoId,labelThreeName,labelThreeId,badgeUrlsLarge,locationLocalizedName,locationId,locationName,locationIsCountry,locationCountryCode,type,members,description'
const getPlacerholderQuestionmarks = (string) => {
    let s = "?"
    let count = string.split(",").length;
    for (let i = 0; i < count - 1; i++) {
        s = s + ", ?"
    }
    return s;
};

const getPreparedWarToAttack = (war) => {
    let res = []
    var datetime = new Date();
    const month = datetime.getMonth() + 1;
    const year = datetime.getFullYear;

    const addAttacksFromClan = (clan, opponent) => {
        let res = []
        clan.members.forEach(member => {
            let getOpponentByTag = tag => {
                return opponent.members.filter(e => e.tag === tag)[0];
            };

            let attack = {
                "attackerTag": member.tag,
                "month": month,
                "defenderTag": member.attacks ? member.attacks[0].defenderTag : noId,
                "defenderClanTag": opponent.tag,
                "duration": member.attacks ? member.attacks[0].duration : 0,
                "destructionPercentage": member.attacks ? member.attacks[0].destructionPercentage : 0,
                "year": year,
                "clanTag": clan.tag,
                "stars": member.attacks ? member.attacks[0].stars : 0,
                "newStars": getNewStars(clan, opponent, member),
                "attackerTownHallLevel": member.townhallLevel,
                "attackOrder": member.attacks ? member.attacks[0].order : 0,
                "defenderTownHallLevel": member.attacks ? getOpponentByTag(member.attacks[0].defenderTag).townhallLevel : 0, //TODO
                "attackerName": member.name,
                "defenderName": member.attacks ? getOpponentByTag(member.attacks[0].defenderTag).name : noId,
                "isFinalDefensiveScore": getIsFinalDefensiveScore(opponent, member),
                "isWarLeagueAttack": isWarLeagueAttack,
                "attckerMapPosition": member.mapPosition
            }
            res.push([
                attack.attackerTag,
                attack.month,
                attack.defenderTag,
                attack.defenderClanTag,
                attack.duration,
                attack.destructionPercentage,
                attack.year,
                attack.clanTag,
                attack.stars,
                attack.newStars,
                attack.attackerTownHallLevel,
                attack.attackOrder,
                attack.defenderTownHallLevel,
                attack.attackerName,
                attack.defenderName,
                attack.isFinalDefensiveScore,
                attack.isWarLeagueAttack,
                attack.attckerMapPosition
            ]);

        });
        return res;
    }
    res.push(...addAttacksFromClan(war.clan, war.opponent));
    res.push(...addAttacksFromClan(war.opponent, war.clan));
    return res;
}


function getNewStars(clan, opponent, member) {
    if (!member.attacks) {
        return 0;
    }
    let newStars;
    if (opponent.members.filter(e => e.tag === member.attacks[0].defenderTag)[0].opponentAttacks > 1) {
        //check who also attacked it
        let earlierAttackers = clan.members.filter(m => {
            if (m.attacks) {
                return m.attacks[0].defenderTag == member.attacks[0].defenderTag &&
                    m.attacks[0].order < member.attacks[0].order;
            }
            return false;
        });
        let compare = (a, b) => a.stars > b.stars ? -1 : 1;
        earlierAttackers.sort(compare);

        newStars = member.attacks[0].stars -
            (earlierAttackers[0] ? earlierAttackers[0].attacks[0].stars : 0);
        if (newStars < 0) {
            newStars = 0;
        }
    } else {
        newStars = member.attacks[0].stars;
    }
    return newStars;
}

function getIsFinalDefensiveScore(opponent, member) {
    if (!member.attacks) {
        return 0;
    }
    let bestAttackerTag = opponent.members.filter(e => e.tag === member.attacks[0].defenderTag)[0].bestOpponentAttack.attackerTag;
    if (bestAttackerTag = member.tag) {
        return sqlTrue;
    } else {
        return sqlFalse;
    }
}

async function asyncFunction(array) {
    let conn;
    try {
        conn = await pool.getConnection();

        conn.beginTransaction();

        conn.batch(`INSERT IGNORE INTO ${attackTableName}(${fieldListAttackTable}) VALUES (${getPlacerholderQuestionmarks(fieldListAttackTable)})`, array, (err, res) => {
            if (err) {
                console.log('handle error');
                console.log((err));
            } else {
                console.log(res.affectedRows); // 2
            }
        });
        //must handle error if any
        conn.commit();

    } catch (err) {
        conn.rollback();
        throw err;
    } finally {
        if (conn) conn.release(); //release to pool
    }
}


let warToMaria = war => {
    let array = getPreparedWarToAttack(war);
    asyncFunction(array);
}

exports.warToMaria = warToMaria;


function getMissingClans() {
    return new Promise(async (resolve, reject) => {
        let conn;
        try {
            conn = await pool.getConnection();
            conn
                .query(`select distinct ${attackTableClanTagField} 
            from ${attackTableName}
            left join ${clanTableName}
                on ${clanTableName}.${clanTableKey} = ${attackTableName}.${attackTableClanTagField}
            where ${clanTableName}.${clanTableKey} is null`)
                .then(rows => {
                    console.log(rows); //[ { 'NOW()': 2018-07-02T17:06:38.000Z }, meta: [ ... ] ]
                    resolve(rows);
                })

        } catch (err) {
            conn.rollback();
            throw err;
        } finally {
            if (conn) conn.release(); //release to pool
        }
    })
}

exports.getMissingClans = getMissingClans;

let insertClanData = clanData => {
    return new Promise(async (resolve, reject) => {
        let conn;
        try {
            conn = await pool.getConnection();
            let array = [
                clanData.tag,
                clanData.name,
                clanData.warLeague.name,
                clanData.warLeague.id,
                clanData.clanVersusPoints,
                clanData.requiredTrophies,
                clanData.requiredVersusTrophies,
                clanData.requiredTownhallLevel,
                clanData.isWarLogPublic,
                clanData.clanLevel,
                clanData.warFrequency,
                clanData.warWinStreak,
                clanData.warWins,
                clanData.warTies || -1,
                clanData.warLosses || -1,
                clanData.clanPoints,
                clanData.chatLanguage ? clanData.chatLanguage.id || '' : '',
                clanData.chatLanguage ? clanData.chatLanguage.name || '' : '',
                clanData.chatLanguage ? clanData.chatLanguage.languageCode || '' : '',
                clanData.labels[0] ? clanData.labels[0].name || '' : '',
                clanData.labels[0] ? clanData.labels[0].id || -1 : -1,
                clanData.labels[1] ? clanData.labels[1].name || '' : '',
                clanData.labels[1] ? clanData.labels[1].id || -1 : -1,
                clanData.labels[2] ? clanData.labels[2].name || '' : '',
                clanData.labels[2] ? clanData.labels[2].id || -1 : -1,
                clanData.badgeUrls.large,
                clanData.location.localizedName || '',
                clanData.location.id,
                clanData.location.name,
                clanData.location.isCountry ? 1 : 0,
                clanData.location.isCountry ? clanData.location.countryCode : '',
                clanData.type,
                clanData.members,
                clanData.description
            ];

            conn
                .query(`INSERT IGNORE INTO ${clanTableName}(${fieldListClanTable}) VALUES (${getPlacerholderQuestionmarks(fieldListClanTable)})`, array)
                .then(res => {
                    console.log(res);
                    resolve(res);
                })

        } catch (err) {
            conn.rollback();
            throw err;
        } finally {
            if (conn) conn.release(); //release to pool
            resolve(clanData);
        }


    })
}

exports.insertClanData = insertClanData;