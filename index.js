const fs = require('fs');
require('dotenv').config()
const {
    google
} = require('googleapis');

const authorize = require('./Authorization/authorise.js');
const refreshAccessToken = require('./Authorization/refresh.js');
const {
    readSheet,
    markSheet,
    notFoundDoc,
    sheetLength
} = require('./Controllers/Google/googleFunctions.js');
let counter = 1;

const limits = async () => {
    let sheets = await authorisationProcess();
    const limit = await sheetLength(sheets);
    if (counter <= limit) {
        readEntity()
    }
};

const readEntity = async () => {
    let sheets = await authorisationProcess();
    let rowDetail = await readSheet(sheets, counter);
    await sortByEntityType(rowDetail);
    counter++;
    console.log(counter);
    limits();
}

const authorisationProcess = async () => {
    const content = fs.readFileSync('./Credentials/credentials.json');
    const auth = await authorize(JSON.parse(content));
    const sheets = google.sheets({
        version: 'v4',
        auth
    });
    return sheets
}

setInterval(refreshAccessToken, 3480000);
limits();