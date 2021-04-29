const fs = require('fs');
const {warToMaria} = require('./mariaDriver');
let rawdata = fs.readFileSync('full_data_04_21 copy.json');
let wars = JSON.parse(rawdata);

wars.forEach(element => {
    warToMaria(element)
});