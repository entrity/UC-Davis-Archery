COL_TIMESTAMP = 1;
COL_DATESTRING = 2;
COL_FORM_URL = 3;
COL_FORM_EDIT_URL = 4;
COL_EMAIL_STATUS = 5;

DATES_DELIMITER = ' & ';

LOG_ROW = null;

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
  var tmpdatestrs = getLog(-1, COL_DATESTRING).split(DATES_DELIMITER);
  var dates = [];
  var datestrs = [];
  for (var i  in tmpdatestrs) {
    var fields = tmpdatestrs[i].split('-');
    var date = new Date(fields[0], fields[1], fields[2]);
    dates.push(date);
    datestrs.push(Utilities.formatString('%s, %s %d', DAYS[date.getDay()], MONTHS[date.getMonth()], date.getDate()))
  }
  var text = 
      "Sign up for this week's lesson! (See the links below.) The signup form will close Friday at 6:00 pm (or when all the openings are taken). If you want to attend the lesson, please sign up early!"
+ lineDelimiter + "You can only attend ONE lesson. You MUST sign-up on the form to be eligible to attend. (If the sign-up form is closed or full *but you have your own equipment* and still want to come, please email us or comment on the facebook post for this week's lesson(s) to ask if we can accomodate you.)"
+ lineDelimiter + lineDelimiter + "Lesson Times:";
  for (var i in datestrs)
    text += Utilities.formatString(lineDelimiter + "%30s from %8s to %8s" + lineDelimiter + "%30s from %8s to %8s",
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
