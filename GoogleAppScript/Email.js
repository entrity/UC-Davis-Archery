EMAIL_IMG_URL = 'https://drive.google.com/file/d/0B1-32OLugCURa3RDbGFlTWQ5R1E/view?usp=sharing';
LISTSERV = 'archery-club@ucdavis.edu';

// Get list of email addresses
function getEmailRecipients() {
  return LISTSERV; // define this in Project properties
}

// Send emails
function sendSignupEmail(formUrl, datesString) {
  var recipients = getEmailRecipients();
  var imgBlob = UrlFetchApp
                           .fetch(EMAIL_IMG_URL)
                           .getBlob()
                           .setName("imgBlob");
  var htmlBody = "<p style='text-align:center'><a href=\"https://lists.ucdavis.edu/sympa/signoff/archery-club\">[Unsubscribe]</a></p>" +
    "<p>" + boilerplate('<br>') + "</p>" +
    "<p>Please complete the form here: <a href='" + formUrl +  "'>" + formUrl + "</a></p>" +
    "<p style='text-align:center'><a href=\"https://lists.ucdavis.edu/sympa/signoff/archery-club\">[Unsubscribe]</a></p>";
  var subject = Utilities.formatString("Lesson Sign-Up %s", datesString);
  var message = {
    to: LISTSERV,
    subject: subject,
    htmlBody: htmlBody,
  };
  MailApp.sendEmail(message);
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
  for (var i in data) {
    var row   = data[i];
    var email = row[headerMap.email];
    if (!email) continue;
    // Collect successful reservations
    var regs = [];
    for (var i = 0; i < sessions.length; i++)
      if (row[i]) regs.push(sessions[i]);
    regs.sort(function (a,b) { return a.valueOf() - b.valueOf() });
    // Compose email body and subject
    var body;
    var subject;
    if (regs.length) {
      body = 'We have reserved a space on the shooting line for you for the following session(s) of Archery Club lessons. We look forward to seeing you!\n\n'+regs.join('\n')+'\n\nPlease notify us ASAP if you cannot attend any of the sessions.\n\nPlease meet us on Howard field, which lies north of the parking structure standing north of the MU: https://tinyurl.com/y8nnju6e';
      subject = 'Your reservations for archery session(s)';
    } else {
      body = 'Unfortunately, because of our shortage of bows, we cannot receive you during a lesson this week.\n\n(There actually remain plenty of spaces on the shooting line, so if you know someone who can lend you a bow and arrows, then please let us know, and we will find a space for you on the line.)\n\nWe hope you will sign up again when the next signup form is posted. When assigning bows for weekend lessons, we prioritize early signups.';
      subject = 'Insufficient resources for this week\'s archery session(s)';
    }
    Logger.log('%s\n%s', row[headerMap.email], body);
    // Build and send email
    var message = {
      to: email,
      subject: subject,
      htmlBody: 'Dear '+row[headerMap.name]+',<br><br>'+body.replace(/\n/g,'<br>')+'<br><br>Kind regards',
    };
    MailApp.sendEmail(message);
  }
}
