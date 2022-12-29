const fs = require('fs');
const {
    google
} = require('googleapis');
require('dotenv').config({ path: "../../.env" })
const sheetName = process.env.SPREADSHEET_NAME;
const spreadsheetId = process.env.SPREADSHEET_ID;

const sheetLength = async sheets => {
    const range = [`${sheetName}!A:Z`];
    const {
        data
    } = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range
    });
    let len = data.values.length;
    return len
};

module.exports = sheetLength;