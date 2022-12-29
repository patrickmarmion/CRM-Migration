//This script retrieves all docs, checks if they have a link to hubspot 
//if so it writes the doc id, doc name, completed date, hubspot entity and hubspot id to a google sheet
//if not it writes to a google sheet only the id, name & completed date

require('dotenv').config({
    path: "../.env"
})
const {
    google
} = require('googleapis');
const axios = require('axios');
const fs = require('fs');
const api_key = process.env.PANDADOC_API_KEY;
const headers = {
    headers: {
        'Content-Type': 'application/json',
        'Authorization': `API-Key ${api_key}`
    }
};
const sheetName = process.env.SPREADSHEET_NAME;
const spreadsheetId = process.env.SPREADSHEET_ID;
const crmOpportunity = process.env.CRM_OPPORTUNITY;
const crmAccount = process.env.CRM_ACCOUNT;
const crmContact = process.env.CRM_CONTACT;
let crmEntity;
let document_id;

let authorize = require('../Authorization/authorise.js');
let refreshAccessToken = require('../Authorization/refresh.js');

let counter = 1;

//Set page number & Set index (needs to be 1 less than the counter always)
let page = 1;
let index = -1;

const listDocuments = async () => {
    index++;
    if (counter % 100 == 0) {
        index = 0;
        page++;
        let response = await axios.get(`https://api.pandadoc.com/public/v1/documents?page=${page}&count=100&order_by=date_created`, headers);
        await length(response.data);
    } else if (counter % 100 !== 0) {
        let response = await axios.get(`https://api.pandadoc.com/public/v1/documents?page=${page}&count=100&order_by=date_created`, headers);
        await length(response.data);
    } else {
        console.log('Script Run Comp'); //Want to check if this is ever hit
        process.exit()
    }
};


const length = async (response) => {
    document_id = response.results[index].id;
    console.log(document_id);
    getDoc(document_id);
};

const getDoc = async (document_id) => {
    let response = await axios.get(`https://api.pandadoc.com/public/v1/documents/${document_id}/details`, headers);
    let metadata = response.data.metadata;
    let docDetail = {
        id: response.data.id,
        name: response.data.name,
        dateComplete: response.data.date_completed
    }

    switch (true) {
        case `${crmOpportunity}` in metadata:
            let opportunityId = response.data.metadata[`${crmOpportunity}`];
            crmEntity = 'opportunity';
            await mark(opportunityId, crmEntity, docDetail);
            counter++;
            console.log(counter);
            listDocuments();
            break;

        case `${crmAccount}` in metadata:
            let accountId = response.data.metadata[`${crmAccount}`];
            crmEntity = 'account'
            await mark(accountId, crmEntity, docDetail);
            counter++;
            console.log(counter);
            listDocuments();
            break;

        case `${crmContact}` in metadata:
            let contactId = response.data.metadata[`${crmContact}`];
            crmEntity = 'contact'
            await mark(contactId, crmEntity, docDetail);
            counter++;
            console.log(counter);
            listDocuments();
            break;

        default:
            console.log('Fail');
            await markFail(docDetail);
            counter++;
            console.log(counter);
            listDocuments();
            break;
    }
};

const mark = async (id, crmEntity, docDetail) => {
    const content = fs.readFileSync('../Credentials/credentials.json');
    const auth = await authorize(JSON.parse(content));
    const sheets = google.sheets({
        version: 'v4',
        auth
    });
    await markSheetSuccess(sheets, counter, id, crmEntity, docDetail);
};

const markFail = async (docDetail) => {
    await new Promise(resolve => setTimeout(resolve, 2000));
    const content = fs.readFileSync('../Credentials/credentials.json');
    const auth = await authorize(JSON.parse(content));
    const sheets = google.sheets({
        version: 'v4',
        auth
    });
    await markSheetFailure(sheets, counter, docDetail);
};

const markSheetSuccess = async (sheets, counter, id, crmEntity, docDetail) => {
    const values = [
        [`${docDetail.id}`, `${docDetail.name}`, `${docDetail.dateComplete}`, `${crmEntity}`, `${id}`]
    ];
    const resource = {
        values,
    };
    const range = `${sheetName}!A${counter}`;
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

const markSheetFailure = async (sheets, counter, docDetail) => {
    const values = [
        [`${docDetail.id}`, `${docDetail.name}`, `${docDetail.dateComplete}`, 'No linked Entity']
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

setInterval(refreshAccessToken, 3480000);
listDocuments();