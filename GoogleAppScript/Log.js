var Log = {
    ss: null,
};

(function (Log) {
    COL_TIMESTAMP = 1;
    COL_DATESTRING = 2;
    COL_FORM_URL = 3;
    COL_FORM_EDIT_URL = 4;
    COL_EMAIL_STATUS = 5;

    DATES_DELIMITER = ' & ';

    function setLog () {
        Log.ss = SpreadsheetApp.openById(LOGFILE_ID);
        Log.curRow = ss.getActiveSheet().getLastRow() + 1;
    }

    // Get value at cell
    Log.get = function (rowOffset, col) {
        if (!Log.ss) setLog();
        return Log.ss.getActiveSheet().getRange(Log.cur + rowOffset, col, 1, 1).getValue();
    }

    // Set value at cell
    // Usage 1: (rowOffset, col, val)
    // Usage 2: (col, val)
    Log.log = function () {
        if (!Log.ss) setLog();
        var rowOffset = 0;
        var col, val;
        if (arguments.length == 3)
            [rowOffset, col, val] = arguments;
        else if (arguments.length == 2)
            [col, val] = arguments;
        var row = rowOffset + Log.curRow;
        Log.ss.getActiveSheet().getRange(row, col, 1, 1).setValue(val);
    }
    
    Log.timestamp = function () {
        Log.log(COL_TIMESTAMP, new Date())
    }

    Log.getLatestDateStrings = function () {
        return Log.get(-1, COL_DATESTRING).toString().split(DATES_DELIMITER);
    }
})(Log);
