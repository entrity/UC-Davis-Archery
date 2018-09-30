CLASS_CAPACITY = 30;

/* Create new form.
  Return reference to form.
  Log form url (col 3) and edit url (col 4)
*/
function createForm(dates) {
  var title = Utilities.formatString('Archery Lesson %s', dates2Str(dates, ', '));
  var form = FormApp.create(title);
  form.setTitle(title); // necessary for use of getTitle()
  var item;
  form.setLimitOneResponsePerUser(true);
  form.setShowLinkToRespondAgain(false);
  form.setAllowResponseEdits(true);
  form.setCollectEmail(true);
  setDescription(form, dates);
  // First & Last Name
  form.addTextItem().setTitle('First & Last Name').setRequired(true)
  // Facebook Name
  form.addTextItem().setTitle('Facebook Name')
  // Student ID#
  form.addTextItem().setTitle('Student ID#').setRequired(true)
  // Email
//  form.addTextItem().setTitle('Email').setRequired(true)
  // How did you receive this form? (Facebook, Email)
  item = form.addMultipleChoiceItem().setTitle('How did you receive this form?').setRequired(false)
  item.setChoices([
       item.createChoice('Facebook'),
       item.createChoice('Email')
  ]);
  // Would you like to buy a club T-Shirt? (Skip this question if not.) (Small, Medium, Large, X-Large)
  item = form.addMultipleChoiceItem().setTitle('Would you like to buy a club T-Shirt for $15? (Skip this question if not.)').setRequired(false)
  item.setChoices([
      item.createChoice('Small'),
      item.createChoice('Medium'),
      item.createChoice('Large'),
      item.createChoice('X-Large'),
  ]);
  // Which session would you like to attend?
  item = form.addMultipleChoiceItem().setTitle('Which session would you like to attend?').setRequired(true);
  item.setHelpText('Options will disappear as sessions become full.');
  item.setChoices(dates2Choices(item, dates));
  // Is there any reason you can only attend a particular lesson (am/pm)?
//  form.addParagraphTextItem().setTitle('Is there a reason you can only attend a certain Lesson Session?').setRequired(false)
//    .setHelpText('There will still be a morning and afternoon session! If you do not have any special reason (i.e. religious, work commitment, friend group, etc...), then we will place you in a session. If you do, state which session you want. More sleep does not count as a valid reason. :P')
  // Are you a paid member?
  item = form.addMultipleChoiceItem().setTitle('Are you a paid member?').setRequired(true)
    item.setHelpText('Paid members need to have submitted a B2H liability waiver and a club membership form. See the links below.')
  item.setChoices([
    item.createChoice('Yes'),
    item.createChoice('No'),
    item.createChoice('No, but I want to be !!! Please complete this form: https://goo.gl/forms/WXKN2qimFZRIvjrh2 and submit a liability waiver on B2H: https://myrecreation.ucdavis.edu/store/index.aspx?view=activity&Unit=60'),
  ]);
  // Is this your first time shooting with UC Davis Archery?
  item = form.addMultipleChoiceItem().setTitle('Is this your first time attending a lesson?').setRequired(true)
  item.setChoices([
    item.createChoice('Yes'),
    item.createChoice('No'),
    item.createChoice('I have shot before, but not with UC Davis Archery'),
  ]);
  // Do you need to rent a bow (or the entire suite of 
  item = form.addMultipleChoiceItem().setTitle('Do you need to borrow a bow (or the entire suite of equipment)?').setRequired(false)
  item.setChoices([
    item.createChoice('Yes'),
    item.createChoice('No (I have my own equipment)'),
  ]);
  // Do you need to borrow other equipment? 
  item = form.addCheckboxItem().setTitle('Do you need to borrow other equipment?').setRequired(false)
  item.setChoices([
    item.createChoice('Arrows'),
    item.createChoice('Arm guard'),
    item.createChoice('Finger tab'),
  ]);
  // If you need to need to rent equipment, are you right-handed or left-handed?
  item = form.addMultipleChoiceItem().setTitle('If you need to need to borrow equipment, are you right-handed or left-handed?').setRequired(false)
  item.setChoices([
    item.createChoice('Right'),
    item.createChoice('Left'),
  ]);
  // Returning renters: would you like to use a sight and stabilizer?
  item = form.addCheckboxItem().setTitle('Returning renters: would you like to use a sight and stabilizer?').setRequired(false)
  item.setHelpText('You must have attended at least 3 lessons to use this equipment (unless you use your own).');
  item.setChoices([
    item.createChoice('Yes'),
  ]);
  // Returning renters: would you like to use a compound bow?
  item = form.addCheckboxItem().setTitle('Returning renters: would you like to use a compound bow?').setRequired(false)
  item.setHelpText('We are looking for lots of compound archers to join the competitive team! You must have attended at least 3 lessons to use this equipment (unless you use your own).');
  item.setChoices([
    item.createChoice('Yes'),
  ]);
  // Output
  Logger.log('Published URL: ' + form.shortenFormUrl(form.getPublishedUrl()));
  Logger.log('Published URL: ' + form.getPublishedUrl());
  Logger.log('Editor URL: ' + form.getEditUrl());
  log(COL_FORM_URL, form.shortenFormUrl(form.getPublishedUrl()));
  log(COL_FORM_EDIT_URL, form.getEditUrl());
  // Remove old submit triggers
  var triggers = ScriptApp.getProjectTriggers();
  for (var i in triggers) {
    if (triggers[i].getTriggerSource() == ScriptApp.TriggerSource.FORMS)
      ScriptApp.deleteTrigger(triggers[i]);
  }
  // Create submit trigger
  ScriptApp.newTrigger('onFormSubmitted')
    .forForm(form).onFormSubmit().create();
  // Return
  return form;
}

function getForm() {
  var triggers = ScriptApp.getProjectTriggers();
  var form;
  for (var i in triggers) {
    if (triggers[i].getTriggerSource() == ScriptApp.TriggerSource.FORMS)
      form = FormApp.openById(triggers[i].getTriggerSourceId());
  }
  return form;
}

function onFormSubmitted(data) {
  var form = getForm();
  updateSessionSeats(form);
}

function setDescription(form) {
  form.setDescription(
    "* The fee for students who are not members of the club is $10."
    + "\n\n* If you wish to get a membership, please sign-up here (https://goo.gl/forms/z9KZ2wm3z4Vy1Yjn2) The fee is $40 for the quarter or $100 for the academic year. Payment can be made with Cash, Check, or Paypal using \"Send money to family and friends\" to \"ucdarcherytreasurer@gmail.com.\" (no cards!)"
    + "\n* Members! Don’t forget to sign up for B2H! (https://myrecreation.ucdavis.edu/store/index.aspx?view=activity&Unit=60)"
    + "\n\n* We will meet at Howard Field, just north of the MU Parking Structure and West of Toomey Track."
    + "\n* Note: If you are in the first session, we need your help with setting up the field. If you are in the second session, we will need your help with taking down the field."
    + "\n* There is free parking at the MU parking structure on weekends, unless there is a special event."
  );
}

function getResponseValue(formResponse, title) {
  var itemResponses = formResponse.getItemResponses();
  for (var j = 0; j < itemResponses.length; j++) {
    var itemResponse = itemResponses[j];
    if (itemResponse.getItem().getTitle() == title)
      return itemResponse.getResponse();
  }
}

function updateSessionSeats(form) {
  var TITLE    = 'Which session would you like to attend?'; 
  var sessions = dates2Sessions(datesFromFormTitle(form.getTitle()));
  var seats    = {}
  for (var i in sessions)
    seats[sessions[i]] = CLASS_CAPACITY;
  // Iterate form responses
  var formResponses = form.getResponses();
  for (var i = 0; i < formResponses.length; i++) {
    var formResponse = formResponses[i];
    var itemResponses = formResponse.getItemResponses();
    for (var j = 0; j < itemResponses.length; j++) {
      var itemResponse = itemResponses[j];
      var title = itemResponse.getItem().getTitle();
      if (title == TITLE) {
        var session = itemResponse.getResponse().replace(/\s*\(.*\).*/,''); 
        seats[session] = parseInt(seats[session]) - 1;
      }
    }
  }
  // Update choices
  var newSessions = [];
  for (var i in sessions) {
    var n = parseInt(seats[sessions[i]]);
    if (n > 0)
      newSessions.push(sessions[i] + ' ('+n.toString()+' openings)');
  }
  // Disable form if indicated
  if (newSessions.length == 0)
    form.setAcceptingResponses(false);
  else {
    // Update form
    var items = form.getItems(FormApp.ItemType.MULTIPLE_CHOICE);
    for (var i in items) {
      var item = items[i];
      if (item.getTitle() == TITLE)
        item.asMultipleChoiceItem().setChoiceValues(newSessions);
    }
  }
  return [seats, sessions];
}

/* Create form for scheduled lessons to occur in the next 7 days */
function createFormCronJob() {
  log(COL_TIMESTAMP, new Date())
  // Check for scheduled lessons from Wed to Wed
  var from = new Date();
  from.setDate(from.getDate() - from.getDay() + 3); // Get Wednesday of current week
  var until = new Date(from);
  until.setDate(from.getDate() + 7); // Get a week from 'from' date
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

function closeFormCronJob() {
  var form = getForm();
  form.setAcceptingResponses(false);
}
