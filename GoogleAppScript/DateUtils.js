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
