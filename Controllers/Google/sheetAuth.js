const fs = require('fs');
const {
    google
} = require('googleapis');
let authorize = require('../../Authorization/authorise');

const sheetAuth = async () => {
    try {
        const content = fs.readFileSync('./Credentials/credentials.json');
        const auth = await authorize(JSON.parse(content), './Credentials/token.json', './Credentials/refresh.json');
        const sheets = google.sheets({
            version: 'v4',
            auth
        });
        return sheets
    } catch (error) {
        throw error;
    }
};

module.exports = sheetAuth