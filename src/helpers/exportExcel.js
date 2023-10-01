// const xlsx = require('xlsx');
const path = require('path');
const xlsx = require('sheetjs-style');

module.exports = async(data, workSheetColumnNames, workSheetColumnKeys, workSheetName) => {
    const workBook = await xlsx.utils.book_new();
    const workSheetData = [];

    if(workSheetColumnKeys && workSheetColumnKeys.length > 0) workSheetData.push(workSheetColumnKeys);
    if(workSheetColumnNames && workSheetColumnNames.length > 0) workSheetData.push(workSheetColumnNames);
    if(data) workSheetData.push(...data);

    const workSheet = await xlsx.utils.aoa_to_sheet(workSheetData);
    workSheet['!cols'] = fitToColumn(workSheetData);

    await xlsx.utils.book_append_sheet(workBook, workSheet, workSheetName, true);

    const colNames = Object.keys(workSheet);

    if(workSheetColumnKeys && workSheetColumnKeys.length > 0){
        for (var i = 0; i < workSheetColumnKeys.length; i++) {
            if (workBook.Sheets[workSheetName][colNames[i]]) {
                workBook.Sheets[workSheetName][colNames[i]].s = {
                    fill: {
                        fgColor: { rgb: "FFFFE0" }
                    },
                    alignment: {
                        vertical: "center",
                        horizontal: "center",
                        wrapText: '1',
                    },
                };
            }
        }
    }

    if(workSheetColumnNames && workSheetColumnNames.length > 0){
        for (var i = workSheetColumnKeys.length; i < workSheetColumnKeys.length + workSheetColumnNames.length; i++) {
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
                    alignment: {
                        vertical: "center",
                        horizontal: "center",
                        wrapText: '1',
                    },
                };
            }
        }
    }
    
    const sheet = xlsx.write(workBook, { type: 'base64', bookType: 'xlsx', compression: true });
    return 'data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,' + sheet;
}

function fitToColumn(arrayOfArray) {
    return arrayOfArray[0].map((a, i) => ({ wch: Math.max(...arrayOfArray.map(a2 => a2[i] ? a2[i].toString().length*1.5 : 0)) }));
}