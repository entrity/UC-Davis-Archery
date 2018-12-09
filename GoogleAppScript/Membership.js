var FIRST_WEEK_ATTENDANCE_SHEET_ID = '1deZqi4z_zE_0hAPFklBUJi8KGuSzHzf2XaRwlxUIEH0';
var MEMBERSHIP_SHEET_ID = '1oXwQN1Bf22RCARJ8Uz5RHxSb_-J8g8S86UAhNZLbhaU';

function getNewMemberships(timestamp) {
  var form = FormApp.openById(MEMBERSHIP_FORM_ID);
  if (!timestamp) timestamp = new Date(new Date() - 7*24*60*60*1000);
  var newResponses = form.getResponses(timestamp);
  var newDicts = newResponses.map(function (response) {
    var dict = {};
    // todo
    return dict;
  });
  return newDicts;
}

function checkForNewMemberships() {
  var newResponses = getNewMemberships();
  Logger.log(newResponses.length);
  return (newResponses.length > 0);
}

function Member (name, studentId, email) {
  this.name = name;
  this.studentId = studentId;
  this.email = email;
}
function memberFromMembershipRow(row) {
  return new Member(row[0]+' '+row[1], row[10], row[12]);
}
function memberFromAttendanceRow (row) {
  return new Member(row[3], row[10], row[9]);
}

function copyDataToMembershipSheet() {
  var sa = SpreadsheetApp.openById(ATTENDANCE_SPREADSHEET_ID);
  var sas = sa.getSheets()[0];
  var att = sas.getDataRange().getValues().slice(1);
  att = att.map(function (r) { return memberFromAttendanceRow(r) });
  var attDict = {}; // name => Member
  for (var i in att) {
    attDict[att[i].name] = att[i];
  }
  var sm = SpreadsheetApp.openById(MEMBERSHIP_SHEET_ID);
  var sms = sm.getSheetByName('Sheet1');
  var range = sms.getDataRange();
  var mem = range.getValues();
  for (var i in mem) {
    if (0 == i) continue;
    // Logger.log(mem[i][0]+' '+mem[i][1])
    var a = attDict[mem[i][0]+' '+mem[i][1]];
    if (!a) continue;
    if (!mem[i][10]) mem[i][10] = a.studentId;
    if (!mem[i][12]) mem[i][12] = a.email;
  }
  range.setValues(mem);
}

function getMemberships() {
  var ss = SpreadsheetApp.openById(MEMBERSHIP_SHEET_ID);
  var sheet = ss.getSheetByName('Sheet1');
  return sheet.getDataRange().getValues();
}

function getMembershipDicts() {
  var all = getMemberships();
  var headers = all[0];
  var data = all.slice(1);
  return data.map(function (row) {
    var d = {};
    for (var i in headers) {
      var h = headers[i];
      d[h] = row[i];
    }
    return d;
  });
}

// Return dict of "last, first" => [1, undefined]
// NB: names (keys) in this dict are ALL lowercase!
function getCompletedB2H() {
  var ss = SpreadsheetApp.openById(MEMBERSHIP_SHEET_ID);
  var sheet = ss.getSheetByName('B2H Completed');
  var data = sheet.getDataRange().getValues();
  var out = {};
  for (var r in data) {
    var invertedName = data[r][0];
    var match = /^\s*([^,]+),\s*([^,]+)\s*$/.exec(invertedName);
    var name = match[2]+' '+match[1];
    out[name.toLowerCase()] = true; // Use downcase b/c of examples like Dongyeon, whose name is "DongYeon" in Sports Clubs records
  }
//  Logger.log(out);
  return out;
}

// Dict is studentid => {}
function WeekAttendance(sheetName) {
  SheetData.call(this, ATTENDANCE_SPREADSHEET_ID, sheetName, 'studentId');
  for (var studentId in this.dict) {
//    Logger.log('studentId %s' ,studentId)
    var obj = this.dict[studentId];
    obj.attendanceCt = parseInt(obj.attendance) || 0;
    obj.signupCt = 0;
    for (var col in obj) // check column names from spreadsheet
      if (/\d{4}.\d{2}.\d{2}/.test(col) && obj[col] && obj[col].trim().length)
        obj.signupCt ++;
  }
}

function GlobalAttendance() {
  SheetData.call(this, MEMBERSHIP_SHEET_ID, 'Attendees', 'StudentId');
}

// Return dict
function getFirstWeekAttendance() {
  var formData = new SheetData(FIRST_WEEK_ATTENDANCE_SHEET_ID, 'Form Responses 1', 'First & Last Name').dict;
  var attendanceData = new SheetData(FIRST_WEEK_ATTENDANCE_SHEET_ID, 'Attendance', 'First & Last Name').dict;
//  Logger.log(attendanceData)
  var out = {};
  for (var name in formData) {
    var signupCt = 0;
    var attD     = attendanceData[name];
    if (attD) {
      if (attD['Sat am'] && attD['Sat am'].trim().length) signupCt ++;
      if (attD['Sat pm'] && attD['Sat pm'].trim().length) signupCt ++;
      if (attD['Sun am'] && attD['Sun am'].trim().length) signupCt ++;
      if (attD['Sun pm'] && attD['Sun pm'].trim().length) signupCt ++;
      var attCt      = attD.Attendance && attD.Attendance.trim().length || 0;
    } else 
      attCt  =0;
    var formD      = formData[name];
    
    var studentId  = formD['studentId'];
    var email      = formD['Email Address'];
    
    out[studentId] = {
      studentId: studentId,
      email: email,
      attendanceCt: attCt,
      signupCt: signupCt,
      name: formD.name,
    };
  }
//  Logger.log(out);
  return out;
}

function getAllWeeksAttendance() {
  // Helper function
  function mergeWeekAttendance(out, weekData) {
    for (var studentId in weekData) {
      if (out[studentId]) {
        out[studentId].signupCt     += weekData[studentId].signupCt;
        out[studentId].attendanceCt += weekData[studentId].attendanceCt;
      } else {
        out[studentId] = weekData[studentId];
        out[studentId].signupCt || (out[studentId].signupCt = 0);
        out[studentId].attendanceCt || (out[studentId].attendanceCt = 0);
      }
    }
  }
  // Get later weeks' attendance
  var ss     = SpreadsheetApp.openById(ATTENDANCE_SPREADSHEET_ID);
  var sheets = ss.getSheets();
  var out = {};
  for (var i in sheets) {
    var sheet = sheets[i];
    var name  = sheet.getName();
    if (/^\s*\d{4}.\d{2}.\d{2}\s*$/.test(name)) { // This is a tab we care about
      Logger.log('fetching attendance from %s', name);
      mergeWeekAttendance(out, new WeekAttendance(name).dict);
    }
  }
  // Get first week's attendance
  mergeWeekAttendance(out, getFirstWeekAttendance());
  // Return
  return out;
}

/*
Build sheet of attendance counts and signup counts, using the 
first week's attendance sheet and the several tabs from the 
attendance sheet that covers all later weeks.
*/
function updateAttendanceCountsFromRosters() {
  var data = getAllWeeksAttendance();
//  Logger.log(data)
  var fields = ['studentId', 'attendanceCt', 'signupCt', 'name', 'email'];
  var I_NAME = 3;
  // Make 2D array of data rows
  var matrix = [];
  for (var studentId in data) {
    var d = data[studentId];
    matrix.push(fields.map(function (field) { return d[field]; }));
  }
  // Sort data rows
//  Logger.log(matrix)
  matrix.sort(function (a,b) { return a[I_NAME].localeCompare(b[I_NAME]); });
  // Insert header row
  matrix.unshift(fields);
  // Write to spreadsheet
  var ss = SpreadsheetApp.openById(MEMBERSHIP_SHEET_ID);
  var sheet = ss.getSheetByName('Attendees');
  sheet.getRange(1, 1, matrix.length, fields.length).setValues(matrix);
  // Update Membership: Sheet1 {email, studentId}
  var sheet1 = ss.getSheetByName('Sheet1');
  var sheet1Data = sheet1.getDataRange().getValues();
  var name2Attendance = new SheetData(MEMBERSHIP_SHEET_ID, 'Attendees', 'name').dict;
//  Logger.log(name2Attendance);
  function isBlank(val) {
    return (!val) || /^\s*$/.test(val);
  }
  for (var r = 1; r < sheet1Data.length; r++) {
    var membershipRow = sheet1Data[r];
    var name = Utilities.formatString('%s %s', membershipRow[0], membershipRow[1]);
    if (name2Attendance[name]) {
      // Logger.log('%s %s %s', name, isBlank(membershipRow[10]), (membershipRow[10]));
      if (isBlank(membershipRow[10])) membershipRow[10] = name2Attendance[name].studentId; // studentId
      if (isBlank(membershipRow[12])) membershipRow[12] = name2Attendance[name].email; // email
    } else {
//      Logger.log('Not found %s', name);
    }
  }
  sheet1.getDataRange().setValues(sheet1Data);
}
