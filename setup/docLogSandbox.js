//This script retrieves all docs, checks if they have a link to hubspot 
//if so it writes the doc id, doc name, completed date, hubspot entity and hubspot id to a google sheet
//if not it writes to a google sheet only the id, name & completed date

require('dotenv').config({
    path: "../.env"
})
const {
    google
} = require('googleapis');
const fs = require('fs');
const api_key = process.env.PANDADOC_API_KEY;
const axiosInstance = require("../config/axiosInstance");
const headers = {
    headers: {
        'Content-Type': 'application/json',
        'Authorization': `API-Key ${api_key}`
    }
};
const sheetName = process.env.SPREADSHEET_NAME;
const spreadsheetId = process.env.SPREADSHEET_ID;

let authorize = require('../Authorization/authorise.js');
let refreshAccessToken = require('../Authorization/refresh.js');
const {
    version2Sheet,
    errorSheet,
    linkedObjSheet
} = require('../Controllers/Google/setupFunctions');

let counter = 1;
let page = 2;

const listDocuments = async () => {
    let response = await axiosInstance.get(`https://api.pandadoc.com/public/v1/documents?page=${page}&count=100&order_by=date_created`, headers);
    await eachDoc(response.data.results);
    page++
    console.log("Page: " + page)
};

const eachDoc = async (docs) => {
    for (const doc in docs) {
        await new Promise(resolve => setTimeout(resolve, 50));
        try {
            let response = await axiosInstance.get(`https://api.pandadoc.com/public/v1/documents/${docs[doc].id}/details`, headers);

            let linked_object = response.data.linked_objects[0];
            if (!linked_object) {
                linkObj = {
                    "provider": "",
                    "entity_type": "",
                    "entity_id": "No Linked CRM Entity"
                }
                let sheets = await sheetAuth();
                await markSheet(sheets, response.data, linkObj);
                await count();
                continue
            }

            let sheets = await sheetAuth();
            await markSheet(sheets, response.data, linked_object);
            await count()
        } catch (error) {
            console.error(error.response.status);
            if (error.response.status == 500) {
                let sheets = await sheetAuth();
                await markError(sheets, error.config.url);
                await count();
                continue
            }
        }
    }
};

const sheetAuth = async () => {
    const content = fs.readFileSync('../Credentials/credentials.json');
    const auth = await authorize(JSON.parse(content));
    const sheets = google.sheets({
        version: 'v4',
        auth
    });
    return sheets
};

const markSheet = async (sheets, docDetail, linked_object) => {
    const values = [
        [`${docDetail.id}`, `${docDetail.name}`, `Document Version: Editor ${docDetail.version}`, `${docDetail.date_created}`, `${docDetail.status}`, `${linked_object.provider}`, `${linked_object.entity_type}`, `${linked_object.entity_id}`]
    ];
    const resource = {
        values,
    };
    const range = `${sheetName}!A${counter}`;
    const valueInputOption = 'USER_ENTERED';
    await sheets.spreadsheets.values.update({
        spreadsheetId,
        range,
        resource,
        valueInputOption
    })
};

const markError = async (sheets, url) => {
    const values = [
        [`Document on page: ${page}, errored`, `${url}`]
    ];
    const resource = {
        values,
    };
    const range = `${sheetName}!A${counter}`;
    const valueInputOption = 'USER_ENTERED';
    await sheets.spreadsheets.values.update({
        spreadsheetId,
        range,
        resource,
        valueInputOption
    })
};

const count = async () => {
    console.log("Row: " + counter);
    counter++
};

const pandaScript = async () => {
    do {
        await listDocuments()
        console.log(counter)
    } while (Number.isInteger(((counter - 1) / 100)) && (page < 500));

    googleScript()
};

const googleScript = async () => {
    let sheets = await sheetAuth();
    await version2Sheet(sheets);
    await errorSheet(sheets);
    await linkedObjSheet(sheets);
}

//setInterval(refreshAccessToken, 3480000);
pandaScript();