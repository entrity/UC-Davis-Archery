COL_TIMESTAMP = 1;
COL_DATESTRING = 2;
COL_FORM_URL = 3;
COL_FORM_EDIT_URL = 4;
COL_EMAIL_STATUS = 5;

DATES_DELIMITER = ' & ';

LOG_ROW = null;

function SheetData (ssId, sheetNameOrIdx, dictKeyColNames) {
  var self = this;
  this.ss      = SpreadsheetApp.openById(ssId);
  if (typeof(sheetNameOrIdx) == 'string')
    this.sheet   = this.ss.getSheetByName(sheetNameOrIdx);
  else
    this.sheet   = this.ss.getSheets()[sheetNameOrIdx];
  var all      = this.all     = this.sheet.getDataRange().getValues();
  var headers  = this.headers = this.all[0];
  if (typeof(dictKeyColNames) == 'string')
    dictKeyColNames = [dictKeyColNames];
  this.keyIdxs = dictKeyColNames.map(function (colName) { return self.headers.indexOf(colName) });
  this.data    = this.all.slice(1);
  this.dict    = this.data.reduce(function (acc, row) {
    var key = self.keyIdxs.map(function (idx) { return row[idx] }).join(' ');
    if (key)
      acc[key] = row.reduce(function (obj, val, c) {
        var col = self.headers[c];
        if (/first.+last.+name/i.test(col)) col = 'name';
        else if (/student.*id/i.test(col))  col = 'studentId';
        else if (/paid/i.test(col))  col = 'isPaid';
        obj[col] = val;
        if (/Membership Type/i.test(col) && !obj.isPaid) {
          obj.isPaid = /fall|\$100|year|exempt/i.test(val);
        }
        return obj;
      }, {});
    return acc;
  }, {});
}

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

function boilerplate(lineDelimiter) {
  var tmpdatestrs = getLog(-1, COL_DATESTRING).toString().split(DATES_DELIMITER);
  var dates = tmpdatestrs.map(function(s){ return new Date(s) });
  var datestrs = dates.map(function(d) { return Utilities.formatString('%s, %s %d', DAYS[d.getDay()], MONTHS[d.getMonth()], d.getDate()) });
  var text = 
"<p>Sign up for this week's lesson! (See the link below.) You MUST submit the form to be eligible to shoot on a \"lesson\" day.</p>"
+"<p>The signup form will close Friday at noon (or earlier, if we notice that all the openings are taken). If you want to attend the lesson, please sign up early!</p>"
+"<p>Please be aware that fall time brings us more signups than we have equipment to accommodate, so we will notify you by email to tell you whether we can accommodate you and when to arrive.</p>"
+"<p>Lesson Times:</p>"
  for (var i in datestrs)
    text += Utilities.formatString("%30s from %8s to %8s<br>%30s from %8s to %8s<br>",
                                    datestrs[i], '9:15am', '11:15am', datestrs[i], '11:15am', '1:00pm');
  return text;
}

function buildFormResponseDict(formResponse) {
  var m = {};
  var itemResponses = formResponse.getItemResponses();
  for (var i in itemResponses) {
    var item = itemResponses[i].getItem();
    m[item.getTitle()] = itemResponses[i].getResponse(); 
  }
  m.timestamp = formResponse.getTimestamp();
  if (!m.email) m.email = formResponse.getRespondentEmail();
  return m;
}

function buildStudentDict(form) {
  var students = form.getResponses().map(buildFormResponseDict);
  //  {Email (Davis email preferred)=meychau@ucdavis.edu, Class Standing=1st year, Student ID=915389324, First Name=Mei, Payment Type (Pay at next lesson)=Cash, Last Name=Chau, Phone Number=6265866385, Membership Type (Please note that membership dues are NON-REFUNDABLE once dues have been paid for the term.) =$35 Quarterly Membership, When?=Fall Quarter}
  var dict = {};
  for (var i in students) {
    var student = students[i];
    student.email = student['Email (Davis email preferred)'] || student['Email'];
    dict[student['Student ID']] = student;
  }
  return dict;
}
