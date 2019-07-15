const XLSX = require('xlsx');

class ExcelHandling {
    constructor(filePath,sheetIndex) {
        this.filepath = filePath;
        this.sheetIndex = sheetIndex;
    }

    getSiteUrls() {
        var workbook = XLSX.readFile(this.filepath);
        var sheetName = workbook.SheetNames[this.sheetIndex];
        var worksheet = workbook.Sheets[sheetName];
        var siteUrls = [];
        for (let index = 2; index <= 1812; index++) {
            var desired_cell = worksheet['A' + index];
            var desired_value = (desired_cell ? desired_cell.v : undefined);
            siteUrls.push(desired_value);
        }
        workbook = null;
        return siteUrls;
    }

    writeIntoCell(cellAddress, data){
        var workbook = XLSX.readFile(this.filepath);
        XLSX.writeFile(workbook,'')
    }
}


module.exports = ExcelHandling;
