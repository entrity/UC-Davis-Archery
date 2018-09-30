COL_TIMESTAMP = 1;
COL_DATESTRING = 2;
COL_FORM_URL = 3;
COL_FORM_EDIT_URL = 4;
COL_EMAIL_STATUS = 5;

DATES_DELIMITER = ' & ';

LOGFILE_ID = '1wIxpjS1rgIrc0uBQqoC-04c_f-izMClRWUSDazsYm2M';
LOG_ROW = null;

var MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
var DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

// Get logging spreadsheet
function getLog(row, col) {
  var ss = SpreadsheetApp.openById(LOGFILE_ID)
  if (LOG_ROW == null) {
    LOG_ROW = ss.getActiveSheet().getLastRow() + 1;
  }
  if (row != undefined && col != undefined)
    return ss.getActiveSheet().getRange(LOG_ROW + row, col, 1, 1).getValue();
  else
    return ss
}

function log(col, val, optionalRowOffset) {
  var sheet = getLog();
  var row = LOG_ROW + (optionalRowOffset||0);
  sheet.getActiveSheet().getRange(row, col, 1, 1).setValue(val)
}

function date2Str(date) {
  return Utilities.formatString("%d-%02d-%02d", date.getYear(), date.getMonth(), date.getDate());
}

function dates2Str(dates, delimiter) {
  var out = [];
  for (var i in dates)
    out.push(date2Str(dates[i]));
  return out.join(delimiter);
}

function getScheduledDates(from, until) {
  var dates = []
  for (i in SCHEDULED_TRIPLETS) {
    try {
      var trip = SCHEDULED_TRIPLETS[i];
      var candidate = new Date(trip[0], trip[1]-1, trip[2]);
      if (candidate.valueOf() > from.valueOf() && candidate.valueOf() < until.valueOf())
      dates.push(candidate);
    } catch (err) {
      Logger.log(err);
    }
  }
  return dates;
}

function myFunction() {
  doGet(null)
}
