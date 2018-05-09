LOGFILE_ID = '1Ce2nLzrKyiUCV9hNZUVM5pgJbUYpvizoWQFM7oMaDDg';
LOG_ROW = null;
var NOW = new Date();
var SUNDAY = new Date(NOW.setDate(NOW.getDate() + 4));

// Handle trigger
function main() {
  log(1, new Date())
  // Create form
  var form = createForm();
  var formUrl = form.getPublishedUrl();
  // Send email
  sendEmail(formUrl);
  // output
  out = ContentService.createTextOutput("Completed this tweedle dee");
  return out;
}

// TODO: 
// - implement getEmailRecipients()
// - implement facebook posting
// - implement Friday-night spreadsheet creation
