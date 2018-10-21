EMAIL_IMG_URL = 'https://drive.google.com/file/d/0B1-32OLugCURa3RDbGFlTWQ5R1E/view?usp=sharing';
LISTSERV = 'archery-club@ucdavis.edu';
UNSUB_P = "<p style='text-align:center'><a href=\"https://lists.ucdavis.edu/sympa/signoff/archery-club\">[Unsubscribe]</a></p>";

// Get list of email addresses
function getEmailRecipients() {
  return ['ucdaggiearchery@gmail.com'];
}

// Send emails
function sendSignupEmail(formUrl, datesString) {
  var recipients = getEmailRecipients();
  var imgBlob = UrlFetchApp
                           .fetch(EMAIL_IMG_URL)
                           .getBlob()
                           .setName("imgBlob");
  var htmlBody = UNSUB_P + "<p>" + boilerplate('<br>') + "</p>" +
    "<p>Please complete the form here: <a href='" + formUrl +  "'>" + formUrl + "</a></p>" + UNSUB_P;
  var subject = Utilities.formatString("Lesson Sign-Up %s", datesString);
  var message = {
    to: LISTSERV,
    subject: subject,
    htmlBody: htmlBody,
  };
  MailApp.sendEmail(message);
}

function sendOpenPracticeEmail() {
  var htmlBody = Utilities.formatString('%s<p>Open Practice today for archery club members!</p> \
                                        <p>If you have attended at least one "Lesson and New Memberships" event (typically held on Sundays) and meet the following criteria for full membership, please come join us! If you haven\'t already, you can get all of these done online today!</p> \
                                        <ol> \
                                           <li>Submit a membership form online (<a href="%s">link</a>)</li> \
                                           <li>Pay for membership (you can pay by Paypal)</li> \
                                           <li>Complete B2H for School Sports Clubs online (<a href="%s">link</a>)</li> \
                                        </ol> \
                                        <p>Meet us on Howard Field (<a href="https://goo.gl/maps/gMshKoZ4nMN2">map</a>) at 4:30 pm to set up. Howard Field lies north of the parking structure which stands north of the MU and east of the tennis courts and west of the running track.</p> \
                                        %s', UNSUB_P, MEMBERSHIP_FORM_URL, B2H_URL, UNSUB_P);
  MailApp.sendEmail({
    to: LISTSERV,
    subject: Utilities.formatString('Open Practice today for Archery Club members'),
    htmlBody: htmlBody,
  });
}

function sendAttendanceEmail() {
  var spreadsheet = SpreadsheetApp.openById(ATTENDANCE_SPREADSHEET_ID);
  Logger.log('attendance Spreadsheet %s', spreadsheet.getUrl());
  var sheet = spreadsheet.getSheets()[0];
  var sessions = []
  var values = sheet.getDataRange().getValues();
  var headers = values[0];
  var data = values.slice(1);
  // Get session (date) columns
  for (var i in headers) {
    if (!/\d{4}-\d{2}/.test(headers[i])) break;
    sessions.push(dtStr2Date(headers[i]));
  }
  // Get map of names to columns
  var headerMap = {};
  for (var i in headers)
    headerMap[headers[i]] = i;
  // Iterate users
  var sets = [[],[]]
  for (var i in data) {
    var row   = data[i];
    var email = row[headerMap.email];
    if (!email) continue;
    if (MailApp.getRemainingDailyQuota() == 0) {
      Logger.log("Quota reached. Unable to email %s", email);
      continue;
    }
    // Collect successful reservations
    var regs = [];
    
    for (var i = 0; i < sessions.length; i++)
      if (row[i]) 
        sets[i].push(email);
  }
  Logger.log(sets[0]);
  Logger.log('------------------')
  Logger.log(sets[1]);
  return;
  
}

function fs()
{Logger.log('qt %s',MailApp.getRemainingDailyQuota())}