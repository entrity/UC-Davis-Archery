/*
Usage:
Set up a trigger for each of the cron job functions.

* createFormCronJob
* sendEmailCronJob

*/
// TODO:
// - implement Friday-night spreadsheet creation


function boilerplate(lineDelimiter) {
  var tmpdatestrs = getLog(-1, COL_DATESTRING).split(DATES_DELIMITER);
  var dates = [];
  var datestrs = [];
  for (var i  in tmpdatestrs) {
    var fields = tmpdatestrs[i].split('-');
    var date = new Date(fields[0], fields[1], fields[2]);
    dates.push(date);
    datestrs.push(Utilities.formatString('%s, %s %d', DAYS[date.getDay()], MONTHS[date.getMonth()], date.getDate()))
  }
  var text = 
      "Sign up for this week's lesson! (See the links below.) The signup form will close Friday at 6:00 pm (or when all the openings are taken). If you want to attend the lesson, please sign up early!"
+ lineDelimiter + "You can only attend ONE lesson. You MUST sign-up on the form to be eligible to attend."
+ lineDelimiter + lineDelimiter + "Lesson Times:";
  for (var i in datestrs)
    text += Utilities.formatString(lineDelimiter + "%30s from %8s to %8s" + lineDelimiter + "%30s from %8s to %8s",
                                    datestrs[i], '9:15am', '11:15am', datestrs[i], '11:15am', '1:00pm');
  return text;
}

function composeFacebookPost() {
  var formUrl = getLog(-1, COL_FORM_URL);
  var text = Utilities.formatString("%s\n\nLesson Sign-up: %s", boilerplate('\n'), formUrl);
  Logger.log(text);
  return text;
}
