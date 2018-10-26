MEMBERSHIP_FIELDS = ['firstName','lastName','isB2HDone','isPaid','attendanceCt','signupCt','paymentType','signupTimestamp','class','phone','studentId','memberType','email',]
MEMBERSHIP_STUDENT_ID_COL = 1 + MEMBERSHIP_FIELDS.indexOf('studentId');
N_BALES             = 15;
N_BALE_OPENINGS     = 4 * N_BALES;
N_BOWS_LEFT_HANDED  = 4;
N_BOWS_RIGHT_HANDED = 30;


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
  return new SheetData(MEMBERSHIP_SHEET_ID, 'Sheet1', 'Student ID').dict;
}
/* Fetch responses to membership form. Update membership spreadsheet.
  Return dict of studentId => memberData */
Membership.prototype.updateSpreadsheet = function () {
  var formDict  = this.fromSignupForm();
  var sheetDict = this.fromSpreadsheet();
  var sheet     = SpreadsheetApp.openById(MEMBERSHIP_SHEET_ID).getSheetByName('Sheet1');
  // Append new members to spreadsheet
  for (var studentId in formDict) {
    if (!sheetDict[studentId]) {
      var rowData = MEMBERSHIP_FIELDS.map(function(f) {return formDict[studentId][f] || ''});
      sheet.appendRow(rowData);
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
    }).map(function (sessName) {
      return sessName.replace(/\s*\([0-9]+ openings\)/,'');
    });
    
  if (/How many sessions/i.test(rits[i].getItem().getTitle())) {
//    Logger.log('maxreg %s', rits[i].getResponse());
    signup.maxRegistrations = parseInt(/\d+/.exec(rits[i++].getResponse())[0]);
  }
  // Handle fields after dates/sessions
  if (/paid member/i.test(rits[i].getItem().getTitle()))
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
  // Update form responses with info from attendance sheet
  var attendance = new SheetData(MEMBERSHIP_SHEET_ID, 'Attendees', 'studentId').dict;
  // Get signup form responses
  var signupForm = this;
  var signups = getForm().getResponses().map(function (r) { return signupForm.translateFormResponse(r) });
  // Make a dict in order to overwrite duplicates
  var dict = {};
  // Get B2H completion (from Membership workbook)
  var b2h = getCompletedB2H();
  // Update form responses with info from membership sheet
  for (var i in signups) {
    var signup = signups[i];
    signup.name = signup.name.trim(); // Having students include extra spaces after their name fouled up our automatic search for B2H matches. This trim call fixes that.
    var member = members[signup.studentId];
    var att    = attendance[signup.studentId] || {};
    signup.attendanceCt  = parseInt(att.attendanceCt || 0);
    signup.signupCt      = parseInt(att.signupCt || 0);  
    if (member) {
      signup.paid          = member.isPaid;
      signup.term          = member.memberType;
    }
    signup.b2h             = b2h[signup.name] || '';
    dict[signup.studentId] = signup;
  }
  // Turn dict into array
  var signups = [];
  for (var studentId in dict)
    signups.push(dict[studentId]);
  // Return
  return signups;
}

// Create sheet holding edge data from ford fulkerson
function createLessonRoster() {
  updateAttendanceCountsFromRosters();
  var data = new SignupForm();
  var signups = data.getSignupData();
  var sessions = data.sessions;
  for (var i in sessions) {
   sessions[i].name = sessions[i].name.replace(/\s*\([0-9]+ openings\)/,''); 
  }
  // Run Ford Fulkerson algorithm to achieve max flow
  var net = new ResidualNetwork(sessions, signups);
  net.fordFulkerson(); // net.users[i].data is signups[i]
  // Prepare output matrix
  var output = [];
  
  var fields = [
    ['paid',             'paid'],
    ['b2h',              'b2h'],
    ['borrowOR',         'OR'],
    ['borrowCompound',   'CMPD'],
    ['tshirt',           'tshirt'],
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
  var nFields = 3 + fields.length; // see rowPrefix and rowSuffix below
Logger.log('%s users %s fields', net.users.length, nFields);
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
      }
    }
  }
Logger.log('nFields %s', nFields);
  // Write edge data to spreadsheet
  var spreadsheet = SpreadsheetApp.openById(ATTENDANCE_SPREADSHEET_ID);
  var sheets = spreadsheet.getSheets();
  var sheet = spreadsheet.getSheetByName('Sheet 1');
Logger.log('range %s %s', output.length, nFields);
  sheet.getRange(1, 2, output.length, nFields).setValues(output);
  Logger.log(sheet.getName());
  // New sheet for this week
  var sheetIndex  = 0;
  var sheetName   = getForm().getTitle().replace(/[A-Z]/gi,'');
  var oldSheet    = spreadsheet.getSheetByName(sheetName);
  if (oldSheet)     spreadsheet.deleteSheet(oldSheet);
  var sheet       = spreadsheet.insertSheet(sheetName, sheetIndex);
  // Reformat output
  var sessionsMap = {}; // sessionName => session
  for (var s in sessions)
    sessionsMap[sessions[s].name] = s;
  var output2 = [];
  var users = {};
  for (var r in output) {
    var row = output[r];
    var name = row[2]; // Column 2 holds the user's name
    // Create primary columns (sliced straight from the edges tab's output)
    if (!users[name]) {
      var sessionCells = Array.apply(null, Array(sessions.length)).map(String.prototype.valueOf,'')
      if (r == 0) Logger.log('lengths %s %s %s', sessionCells.length, sessions.length, row.slice(2).length);
      users[name] = sessionCells.concat(row.slice(2)); // Get name, OR, Compound, paid, tshirt, b2h
    }
    // Update a single session column for the user, based on the current edge
    var sessName = row[0].slice(2);
    var sessIdx  = sessionsMap[sessName];
    var sessCode = (row[1] == 1) ? row[0][0] : ''; // If flow is not zero, this session is a GO for this user
    users[name][sessIdx] = sessCode;
  }
  var usersArray = [];
  for (var k in users) {
    users[k].unshift(''); // Blank value in which to record attendance
    usersArray.push(users[k]);
  }
  // Write second output to sheet (the actual roster sheet)...
  // Format headers
  var headers = fields.map(function (tup) { return tup[1] });
  var nameColBkwdOffset = headers.unshift('name');
  for (var i = sessions.length - 1; i >= 0; i--) headers.unshift(sessions[i].name);
  headers.unshift('attendance');
  nFields = headers.length;
  // Write headers
  Logger.log('headers %s %s', nFields, headers.length);
  Logger.log(headers);
  sheet.getRange(1, 1, 1, nFields).setValues([headers]);
  // Write data
  Logger.log('1st row');
  Logger.log(usersArray[0]);
  Logger.log(nFields);
  var dataRange = sheet.getRange(2, 1, usersArray.length, nFields);
  dataRange.setValues(usersArray);
  Logger.log(spreadsheet.getUrl());
  // Sort data
  var nameIdx = 1 + headers.length - nameColBkwdOffset;
  dataRange.sort(nameIdx);
  // Compute totals on spreadsheet
  var colEnd = 1 + usersArray.length;
  var summaryCellData = [];
  var resourceTypes = ['X', 'R', 'L'];
  function cellRangeStr(col, rowStart, rowEnd) {
    Logger.log('cellRangeSTr %s %s %s', col, rowStart, rowEnd);
    return ''+col+rowStart+':'+col+rowEnd;
  }
  // Create summary cells for X, R, L
  for (var i in resourceTypes) {
    var t = resourceTypes[i];
    var row = [t]
    for (var j in sessions) {
      var col = String.fromCharCode(parseInt(66+parseInt(j)));
      row.push('=countif('+cellRangeStr(col, 2, colEnd)+',"'+t+'")')
    }
    summaryCellData.push(row);
  }
  // Create summary cells for N00b (first-timers)
  var row = ['N00b']
  for (var j in sessions) {
    var col = String.fromCharCode(parseInt(66+parseInt(j)));
    row.push('=ARRAYFORMULA(sum(if(isblank('+cellRangeStr(col,2,colEnd)+')*(isblank('+cellRangeStr('O',2,colEnd)+')+EQ('+cellRangeStr('O',2,colEnd)+', 0)), 1, 0)))')
  }
  summaryCellData.push(row);
  sheet.getRange(4+colEnd, 1, summaryCellData.length, summaryCellData[0].length).setValues(summaryCellData);
  sheet.getRange(4+5+colEnd, 1, 1, 2).setValues([[
    '='+colEnd+' - INDIRECT(ADDRESS(ROW(), COLUMN()+1))',
    '=ARRAYFormula(sum(if((ISBLANK(B2:B'+(colEnd)+')*isblank(C2:c'+(colEnd)+')), 1, 0)))',
  ]]);
  // Set column widths
  sheet.setColumnWidths(1, 3, 24);
  sheet.autoResizeColumn(4);
  sheet.setColumnWidths(5, 5, 24);
  for (var c = 11; c < 20; c++)
    sheet.autoResizeColumn(c);
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

function sadf() {
 var spreadsheet = SpreadsheetApp.openById(ATTENDANCE_SPREADSHEET_ID);
  var sheets = spreadsheet.getSheets();
  var sheet = sheets[0];
  sheet.getDataRange().setWrapStrategy(SpreadsheetApp.WrapStrategy.CLIP);
  for (var c = 11; c < 20; c++)
    sheet.autoResizeColumn(c);
  
}