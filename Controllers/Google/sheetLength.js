const sheetAuth = require('./sheetAuth')

const sheetLength = async (spreadsheetId, sheetName) => {
    const sheets = await sheetAuth();
    const range = [`${sheetName}!A:Z`];
    const response = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range
    });
    const { values } = response.data;
    return values.length;
};

module.exports = sheetLength