const fetch = require("node-fetch");
const prefix = "/api";
let config = {
    "ipForToken": "",
    "token": ""
};

let promiseGetServerIP = () => {
    return new Promise((resole, reject) => {
        fetch('https://api.ipify.org?format=json')
            .then(response => response.json())
            .then(json => resole(json.ip));
    })
}

let initialiseApi = app => {

    //#region Token
    app.route(prefix + '/token')
        .get(async (req, res) => {
            res.send({
                "token": token
            });
        })
        .post(async (req, res) => {
            let {
                newToken,
                ip
            } = req.body;
            config.token = newToken;
            config.ipForToken = ip || await promiseGetServerIP()
            //update global token
            process.env.API_KEY = "Bearer " + config.token;
            res.send({
                "token": token
            });
        });

    app.route(prefix + '/serverIp')
        .get(async (req, res) => {
            promiseGetServerIP().then(ip => res.send({
                "ip": ip
            }))
        })

    app.route(prefix + '/isTokenValidForIp')
        .get(async (req, res) => {
            promiseGetServerIP().then(ip => {
                let isValid = ip == config.ipForToken;
                res.send({
                    "isValid": isValid
                })
            })
        })
    
        app.route(prefix + '/triggerCocApiTo')
        .get(async (req, res) => {

                res.send({
                    "sttus": "not Implemented"
                })

        })



};
module.exports.initialiseApi = initialiseApi;