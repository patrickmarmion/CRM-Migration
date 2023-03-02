require('dotenv').config({
    path: ".env"
});
const fs = require('fs');
const {
    google
} = require('googleapis');
let authorize = require('../../Authorization/authorise');
const spreadsheetId = process.env.SPREADSHEET_ID;
const sheetName = process.env.SPREADSHEET_NAME;

//AUTH FUNCTION
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
        console.log("Error Occured at the sheetAuth function")
        throw error;
    }
};

const readSheet = async (counter, retries = 0) => {
    let sheets = await sheetAuth();
    try {
        const ranges = [`${sheetName}!A${counter}:K${counter}`];
        const {
            data
        } = await sheets.spreadsheets.values.batchGet({
            spreadsheetId,
            ranges,
        });
        let row = {
            new_entity_id: await data.valueRanges[0].values[0][8],
            new_document_id: await data.valueRanges[0].values[0][9],
            crmEntity: await data.valueRanges[0].values[0][6],
            provider: await data.valueRanges[0].values[0][5]
        }
        return row
    } catch (error) {
        if (error.response) {
            if (retries >= 5) {
              throw new Error("Max retries exceeded, giving up.");
            }
            console.log(`Received error, retrying in 3 seconds... (attempt ${retries + 1} of 5)`);
            await new Promise(resolve => setTimeout(resolve, 3000));
            return await readSheet(counter, retries + 1);
          }
          throw error;
    }
};

const writeColumn = async (item, column, counter) => {
    let sheets = await sheetAuth();
    await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `${sheetName}!${column}${counter}`,
        valueInputOption: "USER_ENTERED",
        resource: {
          values: [[item]],
        },
      });
}

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
module.exports = {
    readSheet,
    writeColumn,
    sheetLength
}