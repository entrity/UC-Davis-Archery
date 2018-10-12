/*
Usage:
Set up a time-based trigger for each of the cron job functions.
*/

CLASS_CAPACITY            = 36;
MEMBERSHIP_FORM_URL       = 'https://goo.gl/forms/RJw3HKbUVHAArwQ73';
LOGFILE_ID                = '1wIxpjS1rgIrc0uBQqoC-04c_f-izMClRWUSDazsYm2M';
MEMBERSHIP_FORM_ID        = '1z7FNWHneU1jLYVhXcMR_7TcHbvAL_pKER-NwIq7qS-g';
MEMBERSHIP_SPREADSHEET_ID = '1oXwQN1Bf22RCARJ8Uz5RHxSb_-J8g8S86UAhNZLbhaU';
ATTENDANCE_SPREADSHEET_ID = '11TvCpEpz-oK0Ag5ErLJ4s8z9SfRu1IGwieTq0eqbLgQ';

// TODO:
// - implement Friday-night spreadsheet creation
// - updateMembershipSpreadsheet


function composeFacebookPost() {
  var formUrl = getLog(-1, COL_FORM_URL);
  var text = Utilities.formatString("%s\n\nLesson Sign-up: %s", boilerplate('\n'), formUrl);
  Logger.log(text);
  return text;
}

/*
   Create a google form for any lessons scheduled to occur between this Wednesday and next.
   Because this looks for Wednesday of the current week, this job *MUST NOT* run before Sunday.
   Running this job deletes triggers associated with any other forms, such as forms from the previous
   week's lesson signup.
*/
function cronJobCreateForm() {
  log(COL_TIMESTAMP, new Date())
  // Check for scheduled lessons from Wed to Wed
  var from = new Date();
  from.setDate(from.getDate() - from.getDay() + 3); // Get Wednesday of current week
  Logger.log('from %s', from.toString())
  var until = new Date(from);
  until.setDate(from.getDate() + 7); // Get a week from 'from' date
  Logger.log('until %s', until.toString());
  var dates = getScheduledDates(from, until);
  if (dates.length == 0) {
    log(COL_DATESTRING, '(not scheduled)');
    return;
  } else {
    log(COL_DATESTRING, dates2Str(dates, DATES_DELIMITER));
  }
  // Create form
  createForm(dates);
}

function cronJobCloseForm() {
  var form = getForm();
  // Close form
  form.setAcceptingResponses(false);
  // Update membership spreadsheet from the membership sign-up form
  var membershipSheet = updateMembershipSpreadsheet();
  // Make a spreadsheet using this form's responses and the membership spreadsheet
  createAttendanceSheet();
}

function cronJobSendEmail() {
  var curStatus = getLog(-1, COL_EMAIL_STATUS);
  if (curStatus != 'email sent') {
    var datesString = getLog(-1, COL_DATESTRING);
    var formUrl = getLog(-1, COL_FORM_URL);
    sendSignupEmail(formUrl, datesString);
    log(COL_EMAIL_STATUS, 'email sent', -1);
    Logger.log('email send attempted');
  } else {
    Logger.log('No email send attempted. Already sent.');
  }
}
