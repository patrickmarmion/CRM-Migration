const fs = require('fs');
const {
    google
} = require('googleapis');
require('dotenv').config({ path: "../.env" })
const sheetName = process.env.SPREADSHEET_NAME;
const spreadsheetId = process.env.SPREADSHEET_ID;

const readSheet = async (sheets, counter) => {
    const ranges = [`${sheetName}!A${counter}:E${counter}`];
    const {
        data
    } = await sheets.spreadsheets.values.batchGet({
        spreadsheetId,
        ranges,
    });
    let old_entity_id = await data.valueRanges[0].values[0][3];
    let new_entity_id = await data.valueRanges[0].values[0][4];
    let document_id = await data.valueRanges[0].values[0][0];
    let crmEntity = await data.valueRanges[0].values[0][2];
    return {
        old_entity_id,
        new_entity_id,
        document_id,
        crmEntity
    }
};

const markSheet = async (document_id, sheets, counter) => {
    const values = [
        ['Success', `${document_id}`]
    ];
    const resource = {
        values,
    };
    const range = `${sheetName}!D${counter}:E${counter}`;
    const valueInputOption = 'USER_ENTERED';

    const {
        data
    } = await sheets.spreadsheets.values.update({
        spreadsheetId,
        range,
        resource,
        valueInputOption
    })
};

const notFoundDoc = async (sheets, entity_ids, counter) => {
    const values = [
        [`${entity_ids.old_entity_id}`]
    ];
    const resource = {
        values,
    };
    const range = `${sheetName}!E${counter}`;
    const valueInputOption = 'USER_ENTERED';

    const {
        data
    } = await sheets.spreadsheets.values.update({
        spreadsheetId,
        range,
        resource,
        valueInputOption
    })
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
module.exports = { readSheet,
    markSheet,
    notFoundDoc,
    sheetLength
}