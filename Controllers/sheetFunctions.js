require('dotenv').config({
    path: "../.env"
});
const spreadsheetId = process.env.SPREADSHEET_ID ? process.env.SPREADSHEET_ID : "Please add SpreadSheet ID to the .env File";
const sheetAuth = require('../Authorization/sheetAuth');

const readSheet = async (ranges) => {
    const sheets = await sheetAuth();
    const {
        data
    } = await sheets.spreadsheets.values.batchGet({
        spreadsheetId,
        ranges,
    });
    let rows = data.valueRanges[0].values;
    const linkedObjIdsExist = rows.slice(1).some((subarray) => subarray.length === 11);
    
    return {
        sheetData: rows.slice(1),
        sheets: sheets,
        IdsExist: linkedObjIdsExist
    }
};

const writeToSheet = async (values, sheets, range) => {
    try {
        const resource = {
            values,
        };
        const valueInputOption = 'USER_ENTERED';
        await sheets.spreadsheets.values.update({
            spreadsheetId,
            range,
            resource,
            valueInputOption,
        });
    } catch (error) {
        console.log(error)
    }
};

const appendSheet = async (values, sheets, range) => {
    try {
        const resource = {
            values,
        };
        const valueInputOption = 'USER_ENTERED';
        const insertDataOption = 'INSERT_ROWS';
        await sheets.spreadsheets.values.append({
            spreadsheetId,
            range,
            resource,
            valueInputOption,
            insertDataOption,
        });
    } catch (error) {
        console.log(error);
    }
};

const deleteRowOnSheet = async (sheets, rowNumber) => {
    try {
        const sheetId = await retrieveSheetId(sheets);
        const deleteRequest = {
            deleteDimension: {
                range: {
                    sheetId,
                    dimension: 'ROWS',
                    startIndex: rowNumber + 1,
                    endIndex: rowNumber + 2,
                },
            },
        };

        const request = {
            spreadsheetId,
            resource: {
                requests: [deleteRequest],
            },
        };

        await sheets.spreadsheets.batchUpdate(request);
        console.log(`Row ${rowNumber} deleted successfully.`);
    } catch (error) {
        console.log(error);
    }
};

const retrieveSheetId = async (sheets) => {
    const response = await sheets.spreadsheets.get({
        spreadsheetId,
        ranges: [],
        includeGridData: false,
    });

    const sheetProperties = response.data.sheets;
    const sheetTitle = sheetProperties.find((sheet) => sheet.properties.title === "Docs_With_Linked_Objects");
    const sheetId = sheetTitle.properties.sheetId;
    return sheetId
};

const deleteColumn = async (sheets, sheetName) => {
    try {
      await sheets.spreadsheets.values.clear({
        spreadsheetId,
        range: `${sheetName}!K:K`
      });
  
      console.log('Successfully deleted all values in column K.');
    } catch (error) {
      console.error('Error occurred:', error.message);
    }
};

module.exports = {
    readSheet: readSheet,
    writeToSheet: writeToSheet,
    appendSheet: appendSheet,
    deleteRowOnSheet: deleteRowOnSheet,
    deleteColumn: deleteColumn
}