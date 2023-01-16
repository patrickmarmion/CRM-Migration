require('dotenv').config({ path: "../.env" })
const sheetName = process.env.SPREADSHEET_NAME;
const spreadsheetId = process.env.SPREADSHEET_ID;

const createSheet = async (sheets, title) => {
    sheets.spreadsheets.batchUpdate({
        spreadsheetId: spreadsheetId,
        resource: {
            requests: [{
                addSheet: {
                    properties: {
                        title: title
                    }
                }
            }]
        }
    })
    return title
}

const readSheet = async (sheets) => {
    const ranges = [`${sheetName}!A:H`];
    const {
        data
    } = await sheets.spreadsheets.values.batchGet({
        spreadsheetId,
        ranges,
    });
    let rows = data.valueRanges[0].values;
    return rows
}

const filterRows = async (rows, filter) => {
    let filtRows = rows.filter(k => k.includes(filter));
    return filtRows
}

const filterRowsLinkedObj = async (rows) => {
    let noEntity = rows.filter(k => !k.includes("No Linked CRM Entity"));
    let noError = noEntity.filter(e => !e.includes("https://api.pandadoc.com/public/v1/documents/"))
    return noError
}

const writeSheet = async (sheets, title, filteredRows) => {
    await sheets.spreadsheets.values.append({
        spreadsheetId: spreadsheetId,
        range: title,
        valueInputOption: "USER_ENTERED",
        resource: {
          values: filteredRows,
        },
      })
      return
}

const version2Sheet = async (sheets) => {
    let title = await createSheet(sheets, "Version 2 Docs")
    let rows = await readSheet(sheets)
    let filteredRows = await filterRows(rows, "Document Version: Editor 2");
    await writeSheet(sheets, title, filteredRows);
}

const errorSheet = async () => {
    await createSheet(sheets, "Error Docs")
    let rows = await readSheet(sheets)
    let filteredRows = await filterRows(rows, "Document on page:" );
    await writeSheet(sheets, title, filteredRows);
}

const linkedObjSheet = async () => {
    await createSheet(sheets, "Docs With Linked Objects")
    let rows = await readSheet(sheets)
    let filteredRows = await filterRowsLinkedObj(rows);
    await writeSheet(sheets, title, filteredRows);
}



module.exports = { version2Sheet,
    errorSheet,
    linkedObjSheet
}