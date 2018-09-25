function createForm(dates) {
  var title = Utilities.formatString('%04d-%02d-%02d Archery Lesson', SUNDAY.getYear(), SUNDAY.getMonth(), SUNDAY.getDate())
  var form = FormApp.create(title)
  var item;
  // First & Last Name
  form.addTextItem().setTitle('First & Last Name').setRequired(true)
  // Facebook Name
  form.addTextItem().setTitle('Facebook Name')
  // Student ID#
  form.addTextItem().setTitle('Student ID#').setRequired(true)
  // Email
  form.addTextItem().setTitle('Email').setRequired(true)
  // How did you receive this form? (Facebook, Email)
  item = form.addMultipleChoiceItem().setTitle('How did you receive this form?').setRequired(false)
  item.setChoices([
       item.createChoice('Facebook'),
       item.createChoice('Email')
  ]);
  // Would you like to buy a club T-Shirt? (Skip this question if not.) (Small, Medium, Large, X-Large)
  item = form.addMultipleChoiceItem().setTitle('Would you like to buy a club T-Shirt? (Skip this question if not.)').setRequired(false)
  item.setChoices([
      item.createChoice('Small'),
      item.createChoice('Medium'),
      item.createChoice('Large'),
      item.createChoice('X-Large'),
  ]);
  // Is there any reason you can only attend a particular lesson (am/pm)?
  form.addParagraphTextItem().setTitle('Is there a reason you can only attend a certain Lesson Session?').setRequired(false)
    .setHelpText('There will still be a morning and afternoon session! If you do not have any special reason (i.e. religious, work commitment, friend group, etc...), then we will place you in a session. If you do, state which session you want. More sleep does not count as a valid reason. :P')
  if (dates.length > 1) {
    item = form.addCheckboxItem().setTitle('Which day(s) would you like to attend? (We may only be able to accommodate you for a single day because there is often an overabundance of registrations in Fall quarter.)').setRequired(true);
    item.setChoices(dates2Choices(item, dates));
  }
  // Are you a paid member?
  item = form.addMultipleChoiceItem().setTitle('Are you a paid member?').setRequired(true)
  item.setHelpText('Paid members should sign up for our class on B2H.  Please see the link in the pinned post on Facebook for directions.')
  item.setChoices([
    item.createChoice('Yes'),
    item.createChoice('No'),
    item.createChoice('No, but I want to be !!! Please complete this form: https://goo.gl/forms/WXKN2qimFZRIvjrh2'),
  ]);
  // Is this your first time shooting with UC Davis Archery?
  item = form.addMultipleChoiceItem().setTitle('Is this your first time attending a lesson?').setRequired(true)
  item.setChoices([
    item.createChoice('Yes'),
    item.createChoice('No'),
    item.createChoice('I have shot before, but not with UC Davis Archery'),
  ]);
  // Do you need to rent a bow (or the entire suite of 
  item = form.addMultipleChoiceItem().setTitle('Do you need to rent a bow (or the entire suite of equipment)?').setRequired(false)
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
  item = form.addMultipleChoiceItem().setTitle('If you need to need to rent equipment, are you right-handed or left-handed?').setRequired(false)
  item.setChoices([
    item.createChoice('Right'),
    item.createChoice('Left'),
  ]);
  // Returning renters: would you like to use a sight and stabilizer?
  item = form.addCheckboxItem().setTitle('Returning renters: would you like to use a sight and stabilizer?').setRequired(false)
  item.setHelpText('You must have attended at least 3 lessons to use this equipment.');
  item.setChoices([
    item.createChoice('Yes'),
  ]);
  // Output
  Logger.log('Published URL: ' + form.getPublishedUrl());
  Logger.log('Editor URL: ' + form.getEditUrl());
  log(3, form.getPublishedUrl());
  log(4, form.getEditUrl());
  // Return
  return form;
}

function dates2Choices(item, dates) {
  var choices = [];
  for (var i in dates) {
    choices.push(item.createChoice(date2Str(dates[i])));
  }
  return choices;
}
