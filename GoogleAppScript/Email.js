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
  var htmlBody = Utilities.formatString('%s<p>Open Practice today for archery club members! <em>Saturday we will NOT have the usual "Team Practice" because all of the safety officers will be in Berkeley, so please come to Open Practice this week!</em></p> \
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

function buildAttendanceEmails() {
  /* Skip the first column. All subsequent columns up to "name" are sessions. */
  function buildAttendanceEmail(attendanceRow) {
    var reservations = [];
    var i;
    for (i = 1; i < nameIdx; i++)
      if (attendanceRow[i]) reservations.push(headers[i]);
    var name = attendanceRow[nameIdx];
    var email = attendanceRow[emailIdx];
    if (reservations.length)
      var htmlBody = Utilities.formatString('<p>%s,<p>We have the following session reservation(s) for you this week.<ul>%s</ul><p>Please let us know if there has been an error OR if you cannot attend any of the sessions listed above.<p>We\'re looking forward to seeing you! Meet us on Howard Field (<a href=\'https://goo.gl/maps/gMshKoZ4nMN2\'>map</a>) at 4:30 pm to set up. Howard Field lies north of the parking structure which stands north of the MU and east of the tennis courts and west of the running track.</p>',
      name, reservations.map(function (r) { return '<li>'+r+'</li>' }).join(''));
    else
      var htmlBody = '<p>Alas! We had more signups than we have equipment, so we were not able to reserve a spot on the shooting line for you this week. Please sign up again when next week\'s signup form gets posted. If you\'re already a club member and have attended at least one lesson, please join us at Open Practice and/or Team Practice.';
    var muttCommand = 'mutt -F "365ucdavisrc" -e \'set content_type=text/html\' ' + 
      Utilities.formatString("-s 'Archery reservations for %s this week' -- \"%s\" <<< \"%s\"", name, email, htmlBody);
    return {
      mutt: muttCommand,
      html: htmlBody,
      name: name,
      email: email,
    };
  }
  var spreadsheet = SpreadsheetApp.openById(ATTENDANCE_SPREADSHEET_ID);
  Logger.log('attendance Spreadsheet %s', spreadsheet.getUrl());
  var sheet = spreadsheet.getSheets()[0];
  var sessions = []
  var values = sheet.getDataRange().getValues();
  var headers = values[0];
  var nameIdx, emailIdx;
  for (var i in headers) {
    if (headers[i] == 'name') nameIdx = i;
    else if (headers[i] == 'email') emailIdx = i;
  }
  var data = values.slice(1);
  // Get session (date) columns
  for (var i in data) {
    var archer = data[i];
    var emailStruct = buildAttendanceEmail(archer);
    if (emailStruct.email)
      Logger.log(emailStruct.mutt);
  }
}
