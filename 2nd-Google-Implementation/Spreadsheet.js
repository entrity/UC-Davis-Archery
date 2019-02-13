Spreadsheet = {}

(function () {
	Spreadsheet.toDict = function (idOrURL, tabNameOrIdx, dictKey) {
		var openFn = /^http/.test(idOrURL) ? SpreadsheetApp.openByUrl : SpreadsheetApp.openById;
		var sheet = openFn(idOrURL);
		var tab = typeof(tabNameOrIdx) == 'number' ? sheet.getSheets()[tabNameOrIdx] : sheet.getSheetByName(tabNameOrIdx);
		var data = tab.getDataRange().getValues();
		var keys = data[0];
		var values = data.slice(1);
		return values.reduce(function (acc, row) {
			var dictForRow = keys.reduce(function (acc, key, idx) {
				acc[key] = row[idx];
				return acc;
			}, {});
			acc[dictForRow[dictKey]] = dictForRow;
			return acc;
		}, {});
	}
})();