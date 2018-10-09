/*
After you make a spreadsheet from Form results (using normal web interface), run this script to 
cross-reference with membership lists from this year and last. It will create additional columns
specifying membership and which lesson times work for the user.
*/
var LAST_YEARS_MEMBERSHIP_SPREADSHEET_ID = '1UKtrCCF9USJ2kAkseUWv3jK66tYZgCtm0AIJPYOGH7Y';
var THIS_YEARS_MEMBERSHIP_SPREADSHEET_ID = '1oXwQN1Bf22RCARJ8Uz5RHxSb_-J8g8S86UAhNZLbhaU';
var THIS_WEEKS_LESSON_SPREADSHEET_ID     = '1deZqi4z_zE_0hAPFklBUJi8KGuSzHzf2XaRwlxUIEH0';

function augmentSpreadsheet() {
  
  function getMem0() {
    var ss = SpreadsheetApp.openById(LAST_YEARS_MEMBERSHIP_SPREADSHEET_ID);
    var mem0 = {};
    for (var s = 0; s < 3; s++) {
      var sheet = ss.getSheets()[s];
      var sids = sheet.getRange(2, 4, sheet.getLastRow()-2, 1).getValues();
      for (var r in sids)
        for (var c in sids[r])
          mem0[sids[r][c]] = true;
    }
    return mem0;
  }
  
  // Update membership sheet & get dict of studentId => memberData
  var mm = new Membership();
  mm.updateSpreadsheet();
  
  var mem0 = getMem0(); // last year's members
  var mem1 = mm.fromSpreadsheet(); // this year's members
  
  var sheet = SpreadsheetApp.openById(THIS_WEEKS_LESSON_SPREADSHEET_ID).getSheets()[0];
  var lastCol = 15;
  var COL = lastCol-1;

//  Set header row
  var headerRange = sheet.getRange(1,lastCol+1,1,6);
  headerRange.setValues([[
    ('new this year'),
    ('member this year'),
    ('Sat 9'),
    ('Sat 11'),
    ('Sun 9'),
    ('Sun 11'),
  ]]);

 var col = COL;
  // headerRange.setValues(headerData);
//    Alter user rows
  var lastRow = sheet.getLastRow();
                         Logger.log(lastCol)
  var ssRange     = sheet.getRange(2,1,lastRow-1,1+6+lastCol);
  var ssData      = ssRange.getValues();
  var sessLeftyRange  = [];
  var sessRightyRange = [];
  var sessOwnerRange  = [];
  var sessEmptyRange  = [];
  var abc = "abcdefghijklmnopqrstuvwxyz".toUpperCase();
  for (var r = 0; r < ssData.length; r++) {
    col = 0;
    var timestamp    = ssData[r][col++];
    var email        = ssData[r][col++];
    var name         = ssData[r][col++];
    var fbName       = ssData[r][col++];
    var sid          = ssData[r][col++];
    var channel      = ssData[r][col++];
    var tshirt       = ssData[r][col++].replace(/\(no.*/, ''); // tshirt
    var sessions     = ssData[r][col++];
    var isPaid       = ssData[r][col++];
    var hasShot      = ssData[r][col++];
    var needBow      = ssData[r][col++];
    var needOther    = ssData[r][col++];
    var needOR       = ssData[r][col++];
    var needCompound = ssData[r][col++];
    col = COL;
    ssData[r][++col] = (sid in mem0 ? '.' : 'new this year');  // was here last year
    ssData[r][++col] = (sid in mem1 ? 'member this year' : '.'); // is member this year
    var sessTag;
    var bowCol = 10;
//    Logger.log(needBow)
    if (/left/i.test(needBow)) {
      sessLeftyRange.push(abc[bowCol]+(r+2));
      sessTag = '<~lefty';
    } else if (/right/i.test(needBow)) {
      sessRightyRange.push(abc[bowCol]+(r+2));
      sessTag = 'righty~>';
    } else if (/No/.test(needBow)) {
      sessOwnerRange.push(abc[bowCol]+(r+2));
      sessTag = 'has-gear';
    } else {
      sessEmptyRange.push(abc[bowCol]+(r+2));
      sessTag = '.';
    }
    if (sessions.toISOString) {
      sessions = sessions.getDate() +' '+ sessions.getHours();
      Logger.log('%s %s', sessions, /06\s11/.test(sessions))
    }
    ssData[r][++col] = (/6\s9/.test(sessions)  ? sessTag : '');
    ssData[r][++col] = (/6\s11/.test(sessions) ? sessTag : '');
    ssData[r][++col] = (/7\s9/.test(sessions)  ? sessTag : '');
    ssData[r][++col] = (/7\s11/.test(sessions) ? sessTag : ''); 
    Logger.log(col)
  }
  // set data
  ssRange.setValues(ssData);
  // bgcolor
  Logger.log(sessOwnerRange)
  Logger.log(sessLeftyRange)
  Logger.log(sessRightyRange)
  if (sessLeftyRange.length)
    sheet.getRangeList(sessLeftyRange).setBackground('orange');
  if (sessRightyRange.length)
    sheet.getRangeList(sessRightyRange).setBackground('white');
  if (sessOwnerRange.length)
    sheet.getRangeList(sessOwnerRange).setBackground('green');
  
  //  sort
  ssRange.sort([
    {column:16, ascending:false}, // new member
    {column:17, ascending:false}, // ispaid
    {column:9, ascending:false}, // member
    {column:7, ascending:false}, // tshirt
    {column:1, ascending:true}, // timestamp
  ]);
  
}

// attendance
function attendance ()
{
  var START_COL = 18;
  var sheet = SpreadsheetApp.openById(THIS_WEEKS_LESSON_SPREADSHEET_ID).getSheets()[0];
  var range = sheet.getRange(2, START_COL, sheet.getLastRow()-1, 8);
  var data  = range.getValues();
  for (var c = 0; c < 4; c++) {
    var counts = {'r':0,'l':0,'x':0};
    for (var r = 0; r < data.length; r++) {
      var stat = data[r][c];
      if (/right/.test(stat))     key = 'r';
      else if (/left/.test(stat)) key = 'l';
      else                        key = 'x';
      counts[key] += 1;
      data[r][c+4] = key + ' ' + counts[key];
    }
  }
  range.setValues(data);
}
