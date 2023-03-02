const {
    writeColumn,
    readSheet,
    sheetLength
} = require('./Controllers/Google/googleFunctions');
const createLinkedObject = require('./Controllers/PandaDoc/createLinkedObj');
const deleteLinkedObject = require('./Controllers/PandaDoc/deleteLinkedObj');
const listLinkedObj = require('./Controllers/PandaDoc/listLinkedObj')

const readEntity = async (counter) => {
    let rowDetail = await readSheet(counter);
    if ((rowDetail.provider) && (rowDetail.crmEntity === "opportunity") || (rowDetail.provider) && (rowDetail.crmEntity === "deal")) {
        let linkedObjId = await listLinkedObj(rowDetail.new_document_id);
        await deleteLinkedObject(rowDetail.new_document_id, linkedObjId);
        await createLinkedObject(rowDetail);
        await writeColumn("Object Changed", "K", counter)
    } else {
        await new Promise(resolve => setTimeout(resolve, 250));
        return
    }
}

const script = async () => {
    let counter = await sheetLength();

    for (counter; counter >= 1; counter--) {
        await readEntity(counter)
        console.log(counter)
    }
};

script();