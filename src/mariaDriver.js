require('dotenv').config();
const mariadb = require('mariadb');
const database = "clash_of_clans";
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
const month = 4;
const year = 2021;
const noId = "#0";
const isWarLeagueAttack = sqlTrue;

const attackTableName = "attack";
const fieldListAttackTable = "attackerTag,month,defenderTag,defenderClanTag,duration,destructionPercentage,year,clanTag,stars,newStars,attackerTownHallLevel,attackOrder,defenderTownHallLevel,attackerName,defenderName,isFinalDefensiveScore,isWarLeagueAttack,attckerMapPosition";
const getPlacerholderQuestionmarks = () => {
    let s = "?"
    let count = fieldListAttackTable.split(",").length;
    for (let i = 0; i < count - 1; i++) {
        s = s + ", ?"
    }
    return s;
};

const getPreparedWarToAttack = (war) => {
    let res = []

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

        conn.batch(`INSERT IGNORE INTO ${attackTableName}(${fieldListAttackTable}) VALUES (${getPlacerholderQuestionmarks()})`, array, (err, res) => {
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