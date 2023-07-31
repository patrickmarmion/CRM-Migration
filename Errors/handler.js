const axiosInstance = require("../Config/axiosInstance");
const { appendSheet, deleteRowOnSheet } = require('../Controllers/sheetFunctions');

const status429 = async (errorDetail, retries) => {
    let splitString = errorDetail.split(" ");
    let throttleDelay = parseInt(splitString[splitString.length - 2], 10) * 1000;
    console.log(`Received throttling error, retrying in ${throttleDelay} miliseconds... (attempt ${retries + 1} of 5)`);
    await delay(throttleDelay + 5000);
    return throttleDelay
};

const status403 = async (results, rows, sheets, currentBatch, loopIndex, retries) => {
    console.log(`Received 403 error, writing to error sheet. Error ${retries + 1} of 5)`);

    for (const [i, ele] of currentBatch.entries()) {
        try {
            const response = await axiosInstance(ele);
            results.push({
                "linked_objects": [
                  {
                    "id": response.data.linked_objects[0].id
                  }
                ]
              });
        } catch (error) {
            const rowIndex = loopIndex + i;
            await appendSheet([rows[rowIndex]], sheets, 'Error_Docs');
            await deleteRowOnSheet(sheets, rowIndex)
        }
    };
    return results;
};



const delay = ms => {
    return new Promise(resolve => setTimeout(resolve, ms))
};


module.exports = {
    status429: status429,
    status403: status403
}