// Get logging spreadsheet
function getLog() {
  var ss = SpreadsheetApp.openById(LOGFILE_ID)
  if (LOG_ROW == null) {
    LOG_ROW = ss.getActiveSheet().getLastRow() + 1
  }
  return ss
}

function log(col, val) {
  getLog().getActiveSheet().getRange(LOG_ROW, col, 1, 1).setValue(val)
}

function myFunction() {
  doGet(null)
}
