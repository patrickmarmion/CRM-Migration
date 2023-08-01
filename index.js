require('dotenv').config({
    path: "./.env"
});
const { status429, status403 } = require('./Errors/handler');
const { readSheet, writeToSheet, deleteColumn } = require('./Controllers/sheetFunctions');
const axiosInstance = require("./Config/axiosInstance");
const sheetName = process.env.SPREADSHEET_NAME ? process.env.SPREADSHEET_NAME : "Please add SpreadSheet Name to the .env File";
const accessToken = process.env.PANDADOC_ACCESS_TOKEN ? process.env.PANDADOC_ACCESS_TOKEN : "Please add access token to the .env File";
const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${accessToken}`
};
const concurrencyLimit = 10;
const { promisify } = require('util');
const setTimeoutPromise = promisify(setTimeout);

const makeDelayedApiRequest = async (request, delay) => {
    try {
        await setTimeoutPromise(delay);
        const response = await axiosInstance(request);
        return response.data;
    } catch (error) {
        throw error;
    }
};

const loopThroughIds = async (requestArrays, rows, sheets, actionName, retries = 0, startIndex = 0, prevResults = []) => {
    const urlQueue = requestArrays.slice();
    const results = prevResults.slice();
    let lastProcessedIndex = startIndex;

    while (lastProcessedIndex < urlQueue.length) {
        try {
            console.log(`Queue for ${actionName} Linked Object Ids: ${urlQueue.length - lastProcessedIndex}`);

            const currentBatch = urlQueue.slice(lastProcessedIndex, lastProcessedIndex + concurrencyLimit);
            const batchResults = await Promise.all(
                currentBatch.map((req) => makeDelayedApiRequest(req, 6000))
              );
            results.push(...batchResults);
            lastProcessedIndex += currentBatch.length;
        } catch (error) {
            if (retries >= 5) {
                throw new Error("Max retries exceeded, giving up.");
            };

            if (error.response.status === 429) {
                await status429(error.response.data.detail, retries);
                return await loopThroughIds(requestArrays, rows, sheets, actionName, retries + 1, lastProcessedIndex, results);
            } else if (error.response.status === 403) {
                const errorResults = await status403(results, rows, sheets, urlQueue.slice(lastProcessedIndex, lastProcessedIndex + concurrencyLimit), lastProcessedIndex, retries);
                results.push(...errorResults);
                lastProcessedIndex += concurrencyLimit;
            } else {
                throw error.response;
            }
        }
    };
    return results;
};

const retrieveLinkedObjIds = async (rows, sheets) => {
    const listLinkedObjURLs = rows.map(row => {
        return {
            'url': `https://api.pandadoc.com/public/v1/documents/${row[0]}/linked-objects`,
            'method': 'GET',
            headers
        }
    });
    const results = await loopThroughIds(listLinkedObjURLs, rows, sheets, "retrieving");
    const idArrays = results.map(res => res.linked_objects[0] ? [res.linked_objects[0].id] : [""]);
    idArrays.unshift(["Old Linked Object IDs"]);
    await writeToSheet(idArrays, sheets, `${sheetName}!K1:K`);
    idArrays.shift();
    return idArrays;
};

const deleteLinkedObjs = async (ids, sheets) => {
    const { sheetData } = await readSheet([`${sheetName}!A:K`]);
    const filteredEmptyRows = sheetData.filter(subarray => subarray.length !== 10);
    const filteredEmptyIds = ids.filter(subarray => subarray.every(id => id !== undefined));
    console.log(filteredEmptyRows);
    console.log(filteredEmptyIds);

    const deleteLinkedObjURLs = filteredEmptyRows.map((row, rowIndex) => {
        const id = filteredEmptyIds[rowIndex][0];
            return {
                'url': `https://api.pandadoc.com/public/v1/documents/${row[0]}/linked-objects/${id}`,
                'method': 'DELETE',
                headers
        }
    });
    await loopThroughIds(deleteLinkedObjURLs, sheetData, sheets, "deleting");
    await deleteColumn(sheets, sheetName);
};

const createLinkedObj = async (rows, sheets) => {
    const createLinkedObjectRequest = rows.map(row => {
        return {
            'url': `https://api.pandadoc.com/public/v1/documents/${row[0]}/linked-objects`,
            'method': 'POST',
            'data': {
                'provider': row[7],
                'entity_type': row[8],
                'entity_id': row[9],
            },
            headers
        }
    });
    await loopThroughIds(createLinkedObjectRequest, rows, sheets, "creating");
};

const script = async () => {
    const { sheetData, sheets, IdsExist } = await readSheet([`${sheetName}!A:K`]);
    const linkedObjArray = IdsExist ? sheetData.map(row => [row[10]]) : await retrieveLinkedObjIds(sheetData, sheets);
    await deleteLinkedObjs(linkedObjArray, sheets);
    await createLinkedObj(sheetData, sheets);
};

script();