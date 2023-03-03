const writeColumn = async (item, counter, sheets, spreadsheetId, sheetName) => {
    await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `${sheetName}!K${counter}`,
        valueInputOption: "USER_ENTERED",
        resource: {
          values: [[item]],
        },
      });
}

module.exports = writeColumn;