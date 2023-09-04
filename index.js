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

/**
 * Makes a delayed API request and returns the response data.
 *
 * @param {Object} request - The request object to send to the API.
 * @param {number} delay - The delay in milliseconds before sending the request.
 * @returns {Promise} A promise that resolves to the response data.
 * @throws {Error} If an error occurs during the request.
 */
const makeDelayedApiRequest = async (request, delay) => {
    try {
        await setTimeoutPromise(delay);
        const response = await axiosInstance(request);
        return response.data;
    } catch (error) {
        throw error;
    }
};

/**
 * Loops through an array of requests, making delayed API requests in batches.
 *
 * @param {Array} requestArrays - An array of API request objects.
 * @param {number} rows - The number of rows.
 * @param {Object} sheets - The sheets object.
 * @param {string} actionName - The name of the action.
 * @param {number} retries - The number of retries.
 * @param {number} startIndex - The starting index.
 * @param {Array} prevResults - The previous results.
 * @returns {Promise} A promise that resolves to an array of results.
 * @throws {Error} If max retries are exceeded or an error occurs during the request.
 */
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

/**
 * Retrieves linked object IDs from rows and writes them to a sheet.
 *
 * @param {number} rows - The rows.
 * @param {Object} sheets - The sheets object.
 * @returns {Promise} A promise that resolves to an array of retrieved IDs.
 */
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

/**
 * Deletes linked objects using their IDs.
 *
 * @param {Array} ids - An array of linked object IDs.
 * @param {Object} sheets - The sheets object.
 * @returns {Promise} A promise that resolves when deletion is complete.
 */
const deleteLinkedObjs = async (ids, sheets) => {
    const { sheetData } = await readSheet([`${sheetName}!A:K`]);
    const filteredEmptyRows = sheetData.filter(subarray => subarray.length !== 10);
    const filteredEmptyIds = ids.filter(subarray => subarray.every(id => (id !== undefined) || (id === "")));

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

/**
 * Creates linked objects based on rows' data.
 *
 * @param {number} rows - The rows.
 * @param {Object} sheets - The sheets object.
 * @returns {Promise} A promise that resolves when creation is complete.
 */
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


//Error occured when running script for Tixr in phase delete linked object - examine logs.