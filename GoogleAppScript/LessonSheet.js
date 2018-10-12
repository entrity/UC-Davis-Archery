MEMBERSHIP_FIELDS = ['firstName','lastName','isB2HDone','isPaid','attendanceCt','signupCt','paymentType','signupTimestamp','class','phone','studentId','memberType','email',]
MEMBERSHIP_STUDENT_ID_COL = 1 + MEMBERSHIP_FIELDS.indexOf('studentId');
N_BALES             = 15;
N_BALE_OPENINGS     = 4 * N_BALES;
N_BOWS_LEFT_HANDED  = 4;
N_BOWS_RIGHT_HANDED = 30;

// todo remove duplicates (keeping later submission; will work if we use a hashtable based on studentid)

function Membership () {}

//  Get members from form
Membership.prototype.fromSignupForm = function() {
  formList = FormApp.openById(MEMBERSHIP_FORM_ID).getResponses().map(buildFormResponseDict);
  formDict = {};
  for (var i in formList) {
    for (var key in MEMBERSHIP_KEY_MAP) {
      formList[i][MEMBERSHIP_KEY_MAP[key]] = formList[i][key];
      delete formList[i][key];
    }
    formDict[formList[i].studentId] = formList[i];
  }
  return formDict;
}

// Return dict of studentID => memberData
Membership.prototype.fromSpreadsheet = function () {
  // Get existing student ids from members sheet
  this.ss = SpreadsheetApp.openById(MEMBERSHIP_SPREADSHEET_ID);
  this.sheet = this.ss.getSheets()[0];
  var lastRow = this.sheet.getLastRow();  
  var sheetData = this.sheet.getRange(2,1,lastRow-1,1+MEMBERSHIP_FIELDS.length).getValues();
  sheetDict = {};
  for (var row in sheetData) {
    var member = {};
    for (var f in MEMBERSHIP_FIELDS) {
      var key = MEMBERSHIP_FIELDS[f];
      member[key] = sheetData[row][f];
    }
    sheetDict[member.studentId] = member;
  }
  return sheetDict;
}
/* Fetch responses to membership form. Update membership spreadsheet.
  Return dict of studentId => memberData */
Membership.prototype.updateSpreadsheet = function () {
  var formDict  = this.fromSignupForm();
  var sheetDict = this.fromSpreadsheet();
  var sheet     = this.sheet;
  // Append new members to spreadsheet
  for (var studentId in formDict) {
    if (!sheetDict[studentId]) {
      var rowData = MEMBERSHIP_FIELDS.map(function(f) {return formDict[studentId][f] || ''});
      this.sheet.appendRow(rowData);
    }
  }
}

function Session (name) {
  this.name          = name;
  this.nTargets      = N_BALE_OPENINGS;
  this.nLeftBows     = N_BOWS_LEFT_HANDED;
  this.nRightBows    = N_BOWS_RIGHT_HANDED;
  this.registrations = [];
}
// // Check whether current session has enough bale spots and bows for the given user
// Session.hasResources = function (user) {
//   // todo : ensure that user is not already sheduled for this session
//   return sess.nTargets - 1 >= 0
//   && sess.nRightBows - user.borrowRightBow >= 0
//   && sess.nLeftBows - user.borrowLeftBow >= 0;
// }
// // Attach user to session and vice versa. Decrement session's resources.
// Session.register = function (user) {
//   sess.nTargets   -= 1;
//   sess.nRightBows -= user.borrowRightBow;
//   sess.nLeftBows  -= user.borrowLeftBow;
//   user.weekSessCt += 1;
//   sess.registrations.push(user);
//   user.registrations.push(sess);
// }

function SignupForm () {}
// Make a dictionary with convenient field names from a form response
SignupForm.prototype.translateFormResponse = function (formResponse) {
  var rits = formResponse.getItemResponses();
  var signup = {
    'timestamp': formResponse.getTimestamp(),
    'email': formResponse.getRespondentEmail(),
  };
  var i = 0;
  signup.name      = rits[i++].getResponse();
  signup.studentId = rits[i++].getResponse();
  if (/buy.+shirt/i.test(rits[i].getItem().getTitle()))
    signup.tshirt    = rits[i++].getResponse();
  // Handle dates/sessions input
  var self = this;
  if (!this.sessions) {
    this.sessionNames = rits[i].getItem().asMultipleChoiceItem().getChoices().map(function (c) {return c.getValue()});
    this.sessions = this.sessionNames.map(function (name) { return new Session(name) });
  };
  signup.preferredSession = rits[i++].getResponse();
  if (/CAN.+attend/i.test(rits[i].getItem().getTitle()))
    signup.waitlist = rits[i++].getResponse().toString().split(/,\s*/).sort(function (a,b) {
      (a == signup.preferredSession) - (b == signup.preferredSession)
    });
    
  signup.maxRegistrations = parseInt(/\d+/.exec(rits[i++].getResponse())[0]);
  // Handle fields after dates/sessions
  signup.isMember       = rits[i++].getResponse() != 'No';
  if (rits[i] && /borrow.+bow/.test(rits[i].getItem().getTitle())) {
    signup.borrowBow      = rits[i++].getResponse();
    signup.borrowRightBow = /right/i.test(signup.borrowBow);
    signup.borrowLeftBow  = /left/i.test(signup.borrowBow);
    signup.borrowBow      = ! /No/i.test(signup.borrowBow);
  }
  if (rits[i] && /returning.+sight/i.test(rits[i].getItem().getTitle()))
    signup.borrowOR       = rits[i++].getResponse();
  if (rits[i] && /returning.+compound/i.test(rits[i].getItem().getTitle()))
    signup.borrowCompound = rits[i++].getResponse();
  // Return
  return signup;
}
// ...
SignupForm.prototype.getSignupData = function () {
  // Update membership sheet & get dict of studentId => memberData
  var mm = new Membership();
  mm.updateSpreadsheet();
  var members = mm.fromSpreadsheet();
  // Get signup form responses
  var signupForm = this;
  var signups = getForm().getResponses().map(function (r) { return signupForm.translateFormResponse(r) });
  // Update form responses with info from membership spreadsheets
  for (var i in signups) {
    var signup = signups[i];
    var member = members[signup.studentId];
    if (member) {
      signup.attendanceCt  = parseInt(member.attendanceCt || 0);
      signup.signupCt      = parseInt(member.signupCt || 0);
      signup.b2h           = member.isB2HDone;
      signup.paid          = member.isPaid;
      signup.term          = member.memberType;
    }
  }
  return signups;
}

// Create sheet holding edge data from ford fulkerson
function createAttendanceSheet() {
  var data = new SignupForm();
  var signups = data.getSignupData();
  var sessions = data.sessions;
  // Run Ford Fulkerson algorithm to achieve max flow
  var net = new ResidualNetwork(sessions, signups);
  net.fordFulkerson();
  var output = [];
  var nFields;
  var fields = [
    ['borrowOR',         'OR'],
    ['borrowCompound',   'CPD'],
    ['paid',             'paid'],
    ['tshirt',           'tshirt'],
    ['b2h',              'b2h'],
    ['email',            'email'],
    ['studentId',        'studentId'],
    ['maxRegistrations', 'maxReg'],
    ['term',             'term'],
    ['timestamp',        'timestamp'],
    ['attendanceCt',     'attendanceCt'],
    ['signupCt',         'signupCt'],
    ['preferredSession', 'preferredSession'],
    ['waitlist',         'waitlist'],
  ];
  for (var i in net.users) {
    var user = net.users[i];
    if (/no/i.test(user.data.tshirt)) user.data.tshirt = '';
    for (var j in user.inboundEdges) {
      var edge = user.inboundEdges[j];
      if (edge.isForward) {
        var rowPrefix = [edge.src.name, edge.flow||'', edge.dst.name];
        var rowSuffix = fields.map(function (tup) { return user.data[tup[0]] || '' });
        var row = rowPrefix.concat(rowSuffix);
        output.push(row);
        if (0 == i) nFields = row.length;
      }
    }
  }
  Logger.log(net.users[0].data)
  // Write edge data to spreadsheet
  var spreadsheet = SpreadsheetApp.openById(ATTENDANCE_SPREADSHEET_ID);
  var sheets = spreadsheet.getSheets();
  var sheet = sheets[sheets.length - 1];
  sheet.getRange(1, 1, output.length, nFields).setValues(output);
  Logger.log(sheet.getName());
  // New sheet for this week
  var sheetIndex  = 0;
  var sheetName   = getForm().getTitle().replace(/[A-Z]/gi,'');
  var oldSheet    = spreadsheet.getSheetByName(sheetName);
  if (oldSheet)     spreadsheet.deleteSheet(oldSheet);
  var sheet       = spreadsheet.insertSheet(sheetName, sheetIndex);
  // Reformat output
  var sessionsMap = {};
  for (var s in sessions)
    sessionsMap[sessions[s].name] = s;
  var output2 = [];
  var users = {};
  for (var r in output) {
    var row = output[r];
    if (!users[row[2]]) { // Column 2 holds the user's name
      var sessionCells = Array.apply(null, Array(sessions.length)).map(String.prototype.valueOf,'')
      users[row[2]] = sessionCells.concat(row.slice(2,row.length)); // Get name, OR, Compound, paid, tshirt, b2h
    }
    if (r == 0)
      nFields = users[row[2]].length;
    var sessName = row[0].slice(2);
    var sessIdx  = sessionsMap[sessName];
    // Logger.log('-- --- %s %s %s %s', sessIdx, row[0], row[1], row[2]);
    var sessCode = (row[1] == 1) ? row[0][0] : ''; // If flow is not zero, this session is a GO for this user
    users[row[2]][sessIdx] = sessCode;
  }
  var usersArray = [];
  for (var k in users) {
    usersArray.push(users[k]);
  }
  // Write second output to sheet
  var headers = fields.map(function (tup) { return tup[1] });
  headers.unshift('name');
  for (var s in sessions) headers.unshift(sessions[s].name);
  sheet.getRange(1, 1, 1, nFields).setValues([headers]);
  sheet.getRange(2, 1, usersArray.length, nFields).setValues(usersArray);
  Logger.log(spreadsheet.getUrl());
  // Compute totals on spreadsheet
  var summaryCellData = [
    ['=countif(A1:A'+(usersArray.length)+',"X")', '=countif(B1:B'+(usersArray.length)+',"X")'],
    ['=countif(A1:A'+(usersArray.length)+',"R")', '=countif(B1:B'+(usersArray.length)+',"R")'],
    ['=countif(A1:A'+(usersArray.length)+',"L")', '=countif(B1:B'+(usersArray.length)+',"L")'],
  ];
  sheet.getRange(4+usersArray.length, 1, 3, 2).setValues(summaryCellData);
}



// For mapping signup sheet data to spreadsheet
MEMBERSHIP_KEY_MAP = {
  'Payment Type':    'paymentType',
  'Class Standing':  'class',
  'Phone':           'phone',
  'Student ID':      'studentId',
  'First Name':      'firstName',
  'Last Name':       'lastName',
  'Membership Type': 'memberType',
  'timestamp':       'signupTimestamp',
};
