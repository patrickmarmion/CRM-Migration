let {
    readRow,
    writeColumn,
    sheetLength,
    readSheet
} = require('./Controllers/Google/copyingFunctions');
let docDetails = require('./Controllers/PandaDoc/docDetails');
let downloadDoc = require('./Controllers/PandaDoc/downloadOldDoc');
let Polling = require('./Controllers/PandaDoc/docStatusPolling');
let updateDoc = require('./Controllers/PandaDoc/updateNewDocStatus');
const updateLinkedObject = require('./Controllers/PandaDoc/updateNewDocLinkedObj');
let {
    database,
    createDB,
    sizeFile
} = require('./Database/entry');
const create = require('./Controllers/PandaDoc/createDoc.js');

//Copying Functions 
const index = async (counter) => {
    //Loops though Folder of document's to be migrated and returns ids of Completed Documents
    let doc = await readRow(counter);

    //Retrieve details of each document and download them
    let result = await docDetails(doc.id);

    await downloadDoc(result);

    //Store certain details of document into a json log file 
    //then create a new doc in other workspace from the downloaded PDF
    let {id, owner} = await db(result);

    //Change status of newly created doc to Completed
    await updateDoc(id, result, owner);

    //Write ID of new doc back to spreadsheet
    await writeColumn(id, "J", counter);
};

const db = async (result) => {
    try {
        let dbase = await database(result);
        let entry = await createDB(dbase);
        let check = await sizeFile(entry);
        let createDoc = await create(check.result);
        await Polling(createDoc.id);
        return createDoc;
    } catch (err) {
        console.log(err);
    }
};

const script = async () => {
    let counter = await sheetLength();

    for (counter; counter >= 1; counter--) {
        await index(counter)
        console.log(counter);
    }
};

script();