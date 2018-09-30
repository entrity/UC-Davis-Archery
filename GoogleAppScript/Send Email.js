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

function sendEmailCronJob() {
  var curStatus = getLog(-1, COL_EMAIL_STATUS);
  if (curStatus != 'email sent') {
    var datesString = getLog(-1, COL_DATESTRING);
    var formUrl = getLog(-1, COL_FORM_URL);
    sendEmail(formUrl, datesString);
    log(COL_EMAIL_STATUS, 'email sent', -1);
    Logger.log('email send attempted');
  } else {
    Logger.log('No email send attempted. Already sent.');
  }
}
