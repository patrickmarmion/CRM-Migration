const {
    writeColumn,
    readSheet,
    sheetLength
} = require('./Controllers/Google/googleFunctions');
const updateLinkedObject = require('./Controllers/PandaDoc/updateNewDocLinkedObj');

const readEntity = async (counter) => {
    let rowDetail = await readSheet(counter);
    if ((rowDetail.provider) && (rowDetail.crmEntity === "opportunity") || (rowDetail.provider) && (rowDetail.crmEntity === "deal")) {
        await updateLinkedObject(rowDetail);
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