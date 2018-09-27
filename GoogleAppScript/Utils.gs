COL_TIMESTAMP = 1;
COL_DATESTRING = 2;
COL_FORM_URL = 3;
COL_FORM_EDIT_URL = 4;
COL_EMAIL_STATUS = 5;

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

function log(col, val) {
  getLog().getActiveSheet().getRange(LOG_ROW, col, 1, 1).setValue(val)
}

function getSunday() {  
  var SUNDAY = new Date(NOW);
  for (var i = 1; i < 8; i++) {
    SUNDAY.setDate(SUNDAY.getDate() + 1);
    if (SUNDAY.getDay() == 0)
    return SUNDAY
  }
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
    var trip = SCHEDULED_TRIPLETS[i];
    var candidate = new Date(trip[0], trip[1]-1, trip[2]);
    if (candidate.valueOf() > from.valueOf() && candidate.valueOf() < until.valueOf())
        dates.push(candidate);
  }
  return dates;
}

function myFunction() {
  doGet(null)
}
