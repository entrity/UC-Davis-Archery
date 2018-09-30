MEMBERSHIP_FIELDS = ['firstName','lastName','isB2HDone','isPaid','attendanceCt','signupCt','paymentType','signupTimestamp','class','phone','studentId','memberType',]
MEMBERSHIP_STUDENT_ID_COL = 1 + MEMBERSHIP_FIELDS.indexOf('studentId');

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
/* Fetch responses to membership form. Update membership spreadsheet. Return dict of studentId => memberData */
Membership.prototype.updateSpreadsheet = function () {
  var formDict  = this.fromSignupForm();
  var sheetDict = this.fromSpreadsheet();
  var sheet     = this.sheet;
  // Append new members to spreadsheet
  for (var studentId in formDict) {
    if (!sheetDict[studentId]) {
      var rowData = MEMBERSHIP_FIELDS.map(function(f) {return sheetDict[studentId][f] || ''});
      this.sheet.appendRow(rowData);
    }
  }
}

var getSignupData = function () {
  // Update membership sheet & get dict of studentId => memberData
  mm = new Membership()
  mm.updateSpreadsheet();
  var members = mm.fromSpreadsheet();
  // Get lesson signup form responses
  var signups = getForm().getResponses().map(buildFormResponseDict);
  // Add data from membership ship to lesson signup form responses
  for (var i in signups) {
    var s = signups[i];
    for (var key in SIGNUP_KEY_MAP) {
      s[SIGNUP_KEY_MAP[key]] = s[key];
      delete s[key];
    }
    s.borrowBow      = s.borrowBow && s.borrowBow.replace(/\s\(.*/, '');
    s.borrowOR       = s.borrowOR == ('Yes') || '';
    s.borrowCompound = s.borrowCompound == ('Yes') || '';
    s.attendanceCt   = 0;
    s.signupCt       = 1;
    s.b2h            = '';
    s.paid           = '';
    s.session        = s.session && s.session.replace(/\s*\(\d+ openings\)/, '');
    s.term           = '';
    var member       = members[s.studentId];
    if (member) {
      Logger.log(member)
      s.attendanceCt += parseInt(member.attendanceCt || 0);
      s.signupCt     += parseInt(member.signupCt || 0);
      s.b2h           = member.isB2HDone;
      s.paid          = member.isPaid;
      s.term          = member.memberType;
    }
  }
  return signups;
}

function createAttendanceSheet() {
  // Get lesson signups for current form (the form that has a live trigger for this project)
  var signups = getSignupData();
  signups.sort(function(a,b) {
    var d = 0;
    if (d == 0 && a.session && b.session) d = new Date(b.session) - new Date(a.session);
    if (d == 0 && a.name && b.name) d = b.name.localeCompare(a.name);
    return d;
  });
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

//{
//	Do you need to borrow other equipment?=[Finger tab]
//	Is this your first time attending a lesson?=I have shot before
//	but not with UC Davis Archery
//	Student ID#=23
//	Which session would you like to attend?=2018-09-07 9:15am (30 openings)
//	Would you like to buy a club T-Shirt for $15? (Skip this question if not.)=Large
//	First & Last Name=sdfg
//	Facebook Name=eunice
//	If you need to need to borrow equipment
//	are you right-handed or left-handed?=Left
//	Do you need to borrow a bow (or the entire suite of equipment)?=No (I have my own equipment)
//	Returning renters: would you like to use a sight and stabilizer?=[Yes]
//	Returning renters: would you like to use a compound bow?=[Yes]
//	How did you receive this form?=Email
//	Are you a paid member?=No
//}

// Map keys from sign-up form to keys on Student object
SIGNUP_KEY_MAP =
{
	'Do you need to borrow other equipment?':                                       'borrowAccessories',
	'Is this your first time attending a lesson?':                                  'noob',
	'Student ID#':                                                                  'studentId',
	'Which session would you like to attend?':                                      'session',
	'Would you like to buy a club T-Shirt for $15? (Skip this question if not.)':   'buyTshirt',
	'First & Last Name':                                                            'name',
	'Facebook Name':                                                                'fbName',
	'If you need to need to borrow equipment are you right-handed or left-handed?': 'handed',
	'Do you need to borrow a bow (or the entire suite of equipment)?':              'borrowBow',
    'Returning renters: would you like to use a sight and stabilizer?':             'borrowOR',
    'Returning renters: would you like to use a compound bow?':                     'borrowCompound',
	'How did you receive this form?':                                               'formReceiptChannel',
	'Are you a paid member?':                                                       'thinksPaid',
};
