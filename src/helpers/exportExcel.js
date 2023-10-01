// const xlsx = require('xlsx');
const path = require('path');
const xlsx = require('sheetjs-style');

module.exports = async(data, workSheetColumnNames, workSheetName) => {
    const workBook = await xlsx.utils.book_new();
    const workSheetData = [
        workSheetColumnNames,
        ...data
    ];
    const workSheet = await xlsx.utils.aoa_to_sheet(workSheetData);
    workSheet['!cols'] = fitToColumn(workSheetData);

    await xlsx.utils.book_append_sheet(workBook, workSheet, workSheetName, true);

    const colNames = Object.keys(workSheet);
    for (var i = 0; i < workSheetColumnNames.length; i++) {
        if (workBook.Sheets[workSheetName][colNames[i]]) {
            workBook.Sheets[workSheetName][colNames[i]].s = {
                fill: {
                    fgColor: { rgb: "208108" }
                },
                font: {
                    sz: 14,
                    bold: true,
                    color: { rgb: "ffffff" }
                },
            };
        }
    }
    
    const sheet = xlsx.write(workBook, { type: 'base64', bookType: 'xlsx', compression: true });
    return 'data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,' + sheet;
}

function fitToColumn(arrayOfArray) {
    return arrayOfArray[0].map((a, i) => ({ wch: Math.max(...arrayOfArray.map(a2 => a2[i] ? a2[i].toString().length*1.5 : 0)) }));
}