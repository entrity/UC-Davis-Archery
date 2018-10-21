/* Create new form.
  Return reference to form.
  Log form url (col 3) and edit url (col 4)
*/
function createForm(dates) {
  var title = Utilities.formatString('Archery Lesson %s', dates2Str(dates, ', '));
  var form = FormApp.create(title);
  form.setTitle(title); // necessary for use of getTitle()
  var item;
  form.setLimitOneResponsePerUser(false);
  form.setShowLinkToRespondAgain(false);
  form.setAllowResponseEdits(true);
  form.setCollectEmail(true);
  setDescription(form, dates);
  // First & Last Name
  form.addTextItem().setTitle('First & Last Name').setRequired(true);
  // Student ID#
  form.addTextItem().setTitle('Student ID#').setRequired(true);
  // Would you like to buy a club T-Shirt? (Skip this question if not.) (Small, Medium, Large, X-Large)
  item = form.addMultipleChoiceItem().setTitle('Would you like to buy a club T-Shirt for $15?').setRequired(false);
  item.setChoices([
      item.createChoice('Small'),
      item.createChoice('Medium'),
      item.createChoice('Large'),
      item.createChoice('X-Large'),
      item.createChoice('(not this week)'),
  ]);
  // Which session would MOST you like to attend?
  item = form.addMultipleChoiceItem().setTitle('Mark the session you would MOST like to attend. (Be aware that we may not be able to assign you to this session.)').setRequired(true);
  item.setChoices(dates2Choices(item, dates));
  // Which session CAN you attend?
  item = form.addCheckboxItem().setTitle('Mark ALL sessions which you CAN attend.').setRequired(true);
  item.setHelpText('Friday night, we will email you to tell you which sessions for which we have saved you a spot on the shooting line.');
  item.setChoices(dates2Choices(item, dates));
  // How many sessions would you like to attend?
  item = form.addListItem().setTitle('How many sessions would you like to attend.').setRequired(true);
  var choices = [];
  choices.push(item.createChoice('All ('+dates.length*2+')'));
  for (var n = (dates.length*2)-1; n > 0; n--)
    choices.push(item.createChoice(n));
  item.setChoices(choices);
  // Are you a paid member?
  item = form.addMultipleChoiceItem().setTitle('Are you a paid member?').setRequired(true)
  item.setHelpText('Paid members need to have submitted a B2H liability waiver and a club membership form. See the links below.')
  item.setChoices([
    item.createChoice('Yes'),
    item.createChoice('No'),
    item.createChoice('No, but I want to be !!! Please complete this form: '+MEMBERSHIP_FORM_URL+' and submit a liability waiver on B2H: '+B2H_URL),
  ]);
  // Do you need to rent a bow (or the entire suite of 
  item = form.addMultipleChoiceItem().setTitle('Do you need to borrow a bow?').setRequired(false);
  item.setHelpText('(...or the entire suite of equipment?)');
  item.setChoices([
    item.createChoice('Yes: right-handed'),
    item.createChoice('Yes: left-handed'),
    item.createChoice('No (I have my own equipment)'),
  ]);
  // Returning renters: would you like to use a sight and stabilizer?
  item = form.addCheckboxItem().setTitle('Returning renters: would you like to use a sight and stabilizer?').setRequired(false)
  item.setHelpText('You must have already attended 2 lessons to use this equipment (unless you use your own).');
  item.setChoices([
    item.createChoice('Yes'),
  ]);
  // Returning renters: would you like to use a compound bow?
  item = form.addCheckboxItem().setTitle('Returning renters: would you like to use a compound bow?').setRequired(false)
  item.setHelpText('We are looking for lots of compound archers to join the competitive team! You must have already attended at least 2 lessons to use this equipment (unless you use your own).');
  item.setChoices([
    item.createChoice('Yes'),
  ]);
  // Output
  Logger.log('Published URL: ' + form.shortenFormUrl(form.getPublishedUrl()));
  Logger.log('Published URL: ' + form.getPublishedUrl());
  Logger.log('Editor URL: ' + form.getEditUrl());
  log(COL_FORM_URL, form.shortenFormUrl(form.getPublishedUrl()));
  log(COL_FORM_EDIT_URL, form.getEditUrl());
  // Set property
  var properties = PropertiesService.getScriptProperties();
  properties.setProperty('FORM_ID', form.getId());
  // Return
  return form;
}

function getForm() {
  var properties = PropertiesService.getScriptProperties();
  var formId = properties.getProperty('FORM_ID');
  var form = FormApp.openById(formId);
  return form;
}

function setDescription(form) {
  form.setDescription(
    "* The fee for students who are not members of the club is $10."
    + "\n\n* If you wish to get a membership, please sign-up here ("+MEMBERSHIP_FORM_URL+") The fee is $40 for the quarter or $100 for the academic year. Payment can be made with Cash, Check, or Paypal using \"Send money to family and friends\" to \"ucdarcherytreasurer@gmail.com.\" (no cards!)"
    + "\n* Members: UC Davis Sports Clubs requires that you submit a B2H waiver! ("+B2H_URL+")"
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
