EMAIL_IMG_URL = 'https://drive.google.com/file/d/0B1-32OLugCURa3RDbGFlTWQ5R1E/view?usp=sharing';
LISTSERV = 'archery-club@ucdavis.edu';

// Get list of email addresses
function getEmailRecipients() {
  return ['ucdaggiearchery@gmail.com'];
}

// Send emails
function sendEmail(formUrl, datesString) {
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

function sendEarlySignupEmail(formUrl, datesString) {
  var mm = new Membership();
  mm.updateSpreadsheet();
  var membersDict = mm.fromSpreadsheet();
  var recipients = [];
  for (var studentId in membersDict) {
    var m = membersDict[studentId];
    if (m.email && (m.isPaid || /paypal/i.test(m.paymentType)))
      recipients.push(m.email);
  }
  Logger.log(recipients);
}
