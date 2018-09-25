LOGFILE_ID = '1wIxpjS1rgIrc0uBQqoC-04c_f-izMClRWUSDazsYm2M';
LOG_ROW = null;
var NOW = new Date();
var SUNDAY = getSunday();

// Handle trigger
function main() {
  log(1, new Date())
  // Check for scheduled lessons in the next 7 days
  var dates = getScheduledDates(NOW);
  if (dates.length == 0) {
    log(2, '(not scheduled)');
    return;
  } else {
    log(2, dates2Str(dates)); 
  }
  // Create form
  var form = createForm(dates);
  var formUrl = form.getPublishedUrl();
  // Send email
  sendEmail(formUrl, dates);
  // output
  out = ContentService.createTextOutput("Completed this tweedle dee");
  return out;
}

// TODO: 
// - implement getEmailRecipients()
// - implement Friday-night spreadsheet creation
