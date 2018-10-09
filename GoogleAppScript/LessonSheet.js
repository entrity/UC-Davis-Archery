MEMBERSHIP_FIELDS = ['firstName','lastName','isB2HDone','isPaid','attendanceCt','signupCt','paymentType','signupTimestamp','class','phone','studentId','memberType','email',]
MEMBERSHIP_STUDENT_ID_COL = 1 + MEMBERSHIP_FIELDS.indexOf('studentId');
const N_BALES             = 15;
const N_BALE_OPENINGS     = 4 * N_BALES;
const N_BOWS_LEFT_HANDED  = 4;
const N_BOWS_RIGHT_HANDED = 30;

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
// Check whether current session has enough bale spots and bows for the given user
Session.hasResources = function (user) {
  // todo : ensure that user is not already sheduled for this session
  return sess.nTargets - 1 >= 0
  && sess.nRightBows - user.borrowRightBow >= 0
  && sess.nLeftBows - user.borrowLeftBow >= 0;
}
// Attach user to session and vice versa. Decrement session's resources.
Session.register = function (user) {
  sess.nTargets   -= 1;
  sess.nRightBows -= user.borrowRightBow;
  sess.nLeftBows  -= user.borrowLeftBow;
  user.weekSessCt += 1;
  sess.registrations.push(user);
  user.registrations.push(sess);
}

function SignupForm () {}
// Make a dictionary with convenient field names from a form response
SignupForm.prototype.translateFormResponse = function (formResponse) {
  var rits = formResponse.getItemResponses();
  var signup = {
    'timestamp': formResponse.getTimestamp(),
    'email': formResponse.getEmail(),
  };
  var i = 0;
  signup.name      = rits[i++].getResponse();
  signup.studentId = rits[i++].getResponse();
  signup.tshirt    = rits[i++].getResponse();
  // Handle dates/sessions input
  if (!this.sessions) {
    this.sessionNames = rits[i].getItem().asMultipleChoiceItem().getChoices().map(function (c) {return c.getValue()});
    this.sessions = this.sessionNames.map(function (name) { return new Session(name) });
  };
  signup.preferredSession = rits[i++].getResponse();
  signup.sessions = rits[i++].getResponse().split(', ').sort(function (a,b) {
    (a == signup.preferredSession) - (b == signup.preferredSession)
  });
  signup.maxRegistrations = parseInt(/\d+/.exec(rits[i++].getResponse())[0]);
  // Handle fields after dates/sessions
  signup.isMember       = rits[i++].getResponse() != 'No';
  signup.borrowBow      = rits[i++].getResponse();
  signup.borrowRightBow = /right/i.test(signup.borrowBow);
  signup.borrowLeftBow  = /left/i.test(signup.borrowBow);
  signup.borrowOR       = rits[i++].getResponse();
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
  var signups = getFormattedResponseDicts(getForm());
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
    signup.weekSessCt    = 0;
    signup.registrations = [];
  }
  return signups;
}

var signupForm = new SignupForm();
var signups = signupForm.getSignupData();


function createAttendanceSheet() {
  // Get lesson signups for current form (the form that has a live trigger for this project)
  var data = Signup();
  var signups = data.getSignupData();
  var sessions = data.sessions;
  // Allocate resource data
  var resources = [];
  for (var i = 0; i < dates.length; i++)
    resources.push({'nTargets':N_BALE_OPENINGS, 'nLeftBows':N_BOWS_LEFT_HANDED, 'nRightBows':N_BOWS_RIGHT_HANDED})
  // Make priority queue
  var pQueue = new Heap(signups);
  // 
  
  //  Build spreadsheet for signups
  var spreadsheet = SpreadsheetApp.openById(ATTENDANCE_SPREADSHEET_ID);
  var sheetIndex  = 0;
  var sheetName   = getForm().getTitle().replace(/[A-Z]/gi,'');
  var oldSheet    = spreadsheet.getSheetByName(sheetName);
  if (oldSheet)     spreadsheet.deleteSheet(oldSheet);
  var sheet       = spreadsheet.insertSheet(sheetName, sheetIndex);
  spreadsheet.setActiveSheet(sheet);
  // Helper function to write to sheet
  function set(row, col, val) {
    sheet.getRange(row, col, 1, 1).setValue(val === undefined ? '' : val);
  }
  // Write header line
  var fields = ['name', 'session', 'attendanceCt', 'b2h', 'paid', 'term', 'buyTshirt', 'borrowBow', 'borrowOR', 'borrowCompound', 'borrowAccessories', 'formReceiptChannel', 'studentId', 'noob', 'thinksPaid'];
  for (var f = 0; f < fields.length; f++) {
    set(1, 1.0+f, fields[f]);
  }
  // Iterate signups
  for (var i = 0; i < signups.length; i++) {
    for (var f = 0; f < fields.length; f++)
      set(2.0+i, 1.0+f, signups[i][fields[f]]);
    if (!signups[i].b2h)
      sheet.getRange(2.0+i, 1.0+fields.indexOf('b2h')).setBackgroundRGB(200, 100, 0);
    if (!signups[i].paid)
      sheet.getRange(2.0+i, 1.0+fields.indexOf('paid')).setBackgroundRGB(200, 0, 100);
    if (/year/i.test(signups[i].term))
      sheet.getRange(2.0+i, 1.0+fields.indexOf('term')).setBackgroundRGB(150, 160, 177);
    else if (/fall/i.test(signups[i].term))
      sheet.getRange(2.0+i, 1.0+fields.indexOf('term')).setBackgroundRGB(160, 77, 160);
    else if (/winter/i.test(signups[i].term))
      sheet.getRange(2.0+i, 1.0+fields.indexOf('term')).setBackgroundRGB(100, 100, 255);
    else if (/spring/i.test(signups[i].term))
      sheet.getRange(2.0+i, 1.0+fields.indexOf('term')).setBackgroundRGB(100, 255, 100);
  }
}

//{
//  Payment Type=Paypal (use “Send money to family and friends” to “ucdarcherytreasurer@gmail.com.”),
//  Class Standing=Grad Student,
//  Phone=,
//  Student ID=912588283,
//  First Name=Markham,
//  Last Name=Anderson,
//  Membership Type=$100  - academic year (available Fall qtr only)
//}

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
