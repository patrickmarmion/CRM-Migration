require('dotenv').config({
    path: "./.env"
})
const sheetLength = require('./Controllers/Google/sheetLength');
const readSheet = require('./Controllers/Google/readSheet');
const writeColumn = require('./Controllers/Google/writeColumn');
const createLinkedObject = require('./Controllers/PandaDoc/createLinkedObj');
const deleteLinkedObject = require('./Controllers/PandaDoc/deleteLinkedObj');
const listLinkedObj = require('./Controllers/PandaDoc/listLinkedObj');
const spreadsheetId = process.env.SPREADSHEET_ID ?? (() => { throw new Error("Please add SpreadSheet ID to the .env File") })();
const sheetName = process.env.SPREADSHEET_NAME ?? (() => { throw new Error("Please add SpreadSheet Name to the .env File") })();

const readEntity = async (counter) => {
    const { document_id, provider, crmEntity, new_entity_id, sheets } = await readSheet(counter, spreadsheetId, sheetName);
    if (provider && (crmEntity === "opportunity" || crmEntity === "deal")) {
        const linkedObjId = await listLinkedObj(document_id);
        await deleteLinkedObject(document_id, linkedObjId);
        await createLinkedObject(provider, crmEntity, new_entity_id);
        await writeColumn("Object Changed", counter, sheets, spreadsheetId, sheetName)
    } else {
        await new Promise(resolve => setTimeout(resolve, 250));
        return
    }
}

const script = async () => {
    let counter = await sheetLength(spreadsheetId, sheetName);

    for (counter; counter >= 1; counter--) {
        await readEntity(counter)
        console.log(counter)
    }
};

script();