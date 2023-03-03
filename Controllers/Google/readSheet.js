const sheetAuth = require('./sheetAuth');

const readSheet = async (counter, spreadsheetId, sheetName, retries = 0) => {
    const sheets = await sheetAuth();
    try {
        const ranges = [`${sheetName}!A${counter}:K${counter}`];
        const response = await sheets.spreadsheets.values.batchGet({
            spreadsheetId,
            ranges,
        });
        const [document_id, , , , , provider, crmEntity, , new_entity_id] = response.data.valueRanges[0].values[0];
        return {
            document_id,
            provider,
            crmEntity,
            new_entity_id,
            sheets
        };
    } catch (error) {
        if (error.response) {
            if (retries >= 5) {
              throw new Error("Max retries exceeded, giving up.");
            }
            console.log(`Received error, retrying in 3 seconds... (attempt ${retries + 1} of 5)`);
            await new Promise(resolve => setTimeout(resolve, 3000));
            return await readSheet(counter, spreadsheetId, sheetName, retries + 1);
          }
          throw error;
    }
};

module.exports = readSheet;