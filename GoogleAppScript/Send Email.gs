EMAIL_IMG_URL = 'https://drive.google.com/file/d/0B1-32OLugCURa3RDbGFlTWQ5R1E/view?usp=sharing';

// Get list of email addresses
function getEmailRecipients() {
  return ['mhanderson@ucdavis.edu', 'hugprydi@netscape.net'];
}

// Send emails
function sendEmail(formUrl, dates) {
  var recipients = getEmailRecipients();
  var imgBlob = UrlFetchApp
                           .fetch(EMAIL_IMG_URL)
                           .getBlob()
                           .setName("imgBlob");
  var htmlBody = "<p>The sign-up form for this week's UC Davis Archery lesson(s) / club shoot(s) has been posted.</p>" +
    "<p>Please complete the form here: <a href='" + formUrl +  "'>" + formUrl + "</a></p>";
  var datesString = dates2Str(dates, ' & ');
  var subject = Utilities.formatString("Lesson Sign-Up %s", datesString);
  var message = {
    to: 'ucdaggiearchery@gmail.com',
    bcc: recipients.join(', '),
    subject: subject,
    htmlBody: htmlBody,
  };
  MailApp.sendEmail(message);
}
