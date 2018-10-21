var MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
var DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function getScheduledDates(from, until) {
  var dates = []
  for (i in SCHEDULED_TRIPLETS) {
    try {
      var trip = SCHEDULED_TRIPLETS[i];
      var candidate = new Date(trip[0], trip[1]-1, trip[2]);
      if (candidate.valueOf() > from.valueOf() && candidate.valueOf() < until.valueOf())
      dates.push(candidate);
    } catch (err) {
      Logger.log(err);
    }
  }
  return dates;
}

function dtStr2Date(str) {
  var m = /(\d{4})-(\d{2})-(\d{2}) (\d+:\d+)(\w{2})/.exec(str);
  var fmttedStr = m.slice(1,4).join('/') +' '+ m[4];
  return new Date(fmttedStr);
}

function date2Str(date) {
  return Utilities.formatString("%d-%02d-%02d", date.getYear(), 1+date.getMonth(), date.getDate());
}

function dates2Str(dates, delimiter) {
  var out = [];
  for (var i in dates)
    out.push(date2Str(dates[i]));
  return out.join(delimiter);
}

function strs2dates(strs) {
  var dates = [];
  for (var i in strs) {
    var triplet = strs[i].trim().split('-');
    dates.push(new Date(triplet[0], triplet[1], triplet[2]));
  }
  return dates;
}

function datesFromLog(rowOffset) {
  var strs = getLog(rowOffset, COL_DATESTRING).split(DATES_DELIMITER);
  return strs2dates(strs);
}

function datesFromFormTitle(title) {
  var strs = title.replace(/[-\D,]+/, '').split(', ');
  return strs2dates(strs);
}

function dates2Sessions(dates) {
  var out = [];
  for (var i in dates) {
    out.push(date2Str(dates[i]) + ' 9:15am');
    out.push(date2Str(dates[i]) + ' 11:15am');
  }
  return out;
}

function dates2Choices(item, dates) {
  var choices = [];
  var sessions = dates2Sessions(dates);
  for (var i in sessions) {
    choices.push(item.createChoice(sessions[i] + Utilities.formatString(' (%d openings)', CLASS_CAPACITY)));
  }
  return choices;
}
