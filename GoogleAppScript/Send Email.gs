EMAIL_IMG_URL = 'https://drive.google.com/file/d/0B1-32OLugCURa3RDbGFlTWQ5R1E/view?usp=sharing';

// Get list of email addresses
function getEmailRecipients() {
  return ['mhanderson@ucdavis.edu', 'hugprydi@netscape.net'];
}

// Send emails
function sendEmail(formUrl) {
  var recipients = getEmailRecipients();
  var imgBlob = UrlFetchApp
                           .fetch(EMAIL_IMG_URL)
                           .getBlob()
                           .setName("imgBlob");
  var htmlBody = "<p>The sign-up form for this week's UC Davis Archery lesson & club shoot has been posted.</p>" +
    "<p>Please complete the form here: <a href='" + formUrl +  "'>" + formUrl + "</a></p>" +
    "<img src='cid:genericImg'><br>";
  var subject = Utilities.formatString("Lesson Sign-Up %d-%02d-%02d", SUNDAY.getYear(), SUNDAY.getMonth(), SUNDAY.getDate());
//  bcc: recipients,
  var message = {
    to: 'junkmailbocks@netscape.net',
    bcc: recipients.join(', '),
    subject: subject,
    htmlBody: htmlBody,
    inlineImages: {
      genericImg: imgBlob,
    }
  };
  MailApp.sendEmail(message);
}
