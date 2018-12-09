var ClubShoot = {};

(function () {

	SPREADSHEET_ID = '';

	COL_DATE = 0;
	COL_STATUS = 1;
	COL_FORM_URL = 2;
	COL_FORM_SHORT_URL = 3;

	FORM_ID_KEY     = 'ClubShoot_SIGNUP_FORM_ID';
	FORM_DATE_KEY   = 'ClubShoot_SIGNUP_FORM_DATE';
	FORM_STATUS_KEY = 'ClubShoot_SIGNUP_FORM_STATUS';

	STATUS_INIT    = 'email init';
	STATUS_SENT    = 'email sent';
	STATUS_CREATED = 'email created';
	STATUS_CLOSED  = 'form closed';

	/* PRIVATE FUNCTIONS */

	function sendSignupEmail(formUrl, datesString) {
		var htmlBody = Email.UNSUB_P + "<p>" + boilerplate('<br>') + "</p>"
			+ "<p>Please complete the form here: <a href='" + formUrl +  "'>" + formUrl + "</a></p>"
			+ Email.SIGNATURE
			+ Email.UNSUB_P;
		var subject = Utilities.formatString("Lesson Sign-Up %s", datesString);
		MailApp.sendEmail({
			to: Email.LISTSERV,
			subject: subject,
			htmlBody: htmlBody,
		});
	}
	function setFormDescription(form) {
		form.setDescription(
			"* The fee for students who are not members of the club is $10."
			+ "\n\n* If you wish to get a membership, please sign-up here ("+MEMBERSHIP_FORM_URL+") The fee is $40 for the quarter or $100 for the academic year. Payment can be made with Cash, Check, or Paypal using \"Send money to family and friends\" to \"ucdarcherytreasurer@gmail.com.\" (no cards!)"
			+ "\n* Members: UC Davis Sports Clubs requires that you submit a B2H waiver! ("+B2H_URL+")"
			+ "\n\n* We will meet at Howard Field, just north of the MU Parking Structure and West of Toomey Track."
			+ "\n* Note: If you are in the first session, we need your help with setting up the field. If you are in the second session, we will need your help with taking down the field."
			+ "\n* There is free parking at the MU parking structure on weekends, unless there is a special event."
		);
	}
	function dateStrings2SessionStrings(dateStrings) {
		var sessionLabels = [];
		for (var i in dateStrings) {
			var dS = dateStrings[i];
			sessionLabels.push( dS + ' 9:15am' );
			sessionLabels.push( dS + ' 11:15am' );
		}
		return sessionLabels;
	}

	/* EXPOSED FUNCTIONS */

	ClubShoot.getForm = function () {
		var formId = Properties.get(FORM_ID_KEY);
		return formId ? FormApp.openById(formId) : null;
	}
	ClubShoot.sendSignupEmail = function () {
		var form = ClubShoot.getForm();
		if (form) {
			var status = Properties.get(FORM_STATUS_KEY);
			if (status == STATUS_SENT)
				Logger.log('Email not sent. Already sent.')
			else {
				var shortUrl   = form.shortenFormUrl(formUrl);
				var dateString = Properties.get(FORM_DATE_KEY);
				if (sendSignupEmail(shortUrl, dateString)) {
					Properties.set(FORM_STATUS_KEY, STATUS_SENT)
					Logger.log('Email sent.');
				} else
					Logger.log('Failed to send email.')
			}
		}
	}
	ClubShoot.createForm = function (dateStrings) {
		var datesString = dateStrings.join(', ')
		Properties.set(FORM_DATE_KEY, datesString);
		Properties.set(FORM_STATUS_KEY, STATUS_INIT);

		sessionLabels = dateStrings2SessionStrings(dateStrings);

		var title = Utilities.formatString('Archery Lesson %s', datesString);
		var form = FormApp.create(title);
		form.setTitle(title); // necessary for use of getTitle()
		var item;
		form.setLimitOneResponsePerUser(false);
		form.setShowLinkToRespondAgain(false);
		form.setAllowResponseEdits(true);
		form.setCollectEmail(true);
		setFormDescription(form);
		// First & Last Name
		form.addTextItem().setTitle('First & Last Name').setRequired(true);
		// Student ID#
		form.addTextItem().setTitle('Student ID#').setRequired(true);
		// Would you like to buy a club T-Shirt? (Skip this question if not.) (Small, Medium, Large, X-Large)
		item = form.addMultipleChoiceItem().setTitle('Would you like to buy a club T-Shirt for $15?').setRequired(false);
		item.setHelpText('To pay for and collect your T-shirt, please ask to speak with our treasurer during check-in.');
		item.setChoices([
		  item.createChoice('Small'),
		  item.createChoice('Medium'),
		  item.createChoice('Large'),
		  item.createChoice('X-Large'),
		  item.createChoice('(not this week)'),
		]);
		// Which session would MOST you like to attend?
		item = form.addMultipleChoiceItem().setTitle('Mark the session you would MOST like to attend. (Be aware that we may not be able to assign you to this session.)').setRequired(true);
		item.setChoices(sessionLabels.map(function (lbl) {item.createChoice(lbl)}));
		// Which session CAN you attend?
		item = form.addCheckboxItem().setTitle('Mark ALL sessions which you CAN attend.').setRequired(true);
		item.setHelpText('Friday night, we will email you to tell you which sessions for which we have saved you a spot on the shooting line.');
		item.setChoices(sessionLabels.map(function (lbl) {item.createChoice(lbl)}));
		// How many sessions would you like to attend?
		item = form.addListItem().setTitle('How many sessions would you like to attend.').setRequired(true);
		var choices = [];
		choices.push(item.createChoice('All ('+sessionLabels.length+')'));
		for (var n = sessionLabels.length-1; n > 0; n--)
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
		// Set properties
		Properties.set(FORM_ID_KEY, form.getId());
		Properties.set(FORM_STATUS_KEY, STATUS_CREATED);
		// Return
		return form;
	}
	ClubShoot.getScheduledDateStrings = function (from, until) {
	  var spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
	  var sheet = spreadsheet.getSheets()[0];
	  var values = sheet.getDataRange().getValues();
	  var dates = values.map(function (row) {
	  	return new Date(row[0]); // row should have only one value
	  });
	  var dateStrings = [];
	  for (var i in dates) {
	  	if (dates[i] >= from && dates[i] < until)
	  		dateStrings.push(values[i][0]);
	  }
	  return dateStrings;
	}
	ClubShoot.closeForm = function () {
		var form = getForm();
		if (form) {
			form.setAcceptingResponses(false);
			Properties.set(FORM_STATUS_KEY, STATUS_CLOSED);
		}
		return !!form;
	}
	ClubShoot.createRoster = function () {
		// Get signup form responses
		/*
			sessions is an array of objects: {
				name: string (arbitrary)
			}
			users is an array of objects {
				name: string (arbitrary)
				data: {
					waitlist: [array of strings matching sessions[i].name]
					maxRegistrations : int
					borrowBow      : bool
					borrowRightBow : bool
					borrowLeftBow  : bool
					timestamp: date of when weekly signup form was submitted
					isMember: bool
				}
			}
		*/
		var [signups, sessions] = Lesson.Form.getSignupsAndSessions(); // todo
		// Get member info
		var b2hInfo = Membership.updateB2H(); // todo
		var paymentInfo = Membership.getPaymentInfo(); // todo
		var attendanceInfo = Membership.incrementAttendanceFromRoster(); // todo
		// Run Ford Fulkerson algorithm to achieve max flow
		var net = new ResidualNetwork(sessions, signups); // todo
		net.fordFulkerson(); // net.users[i].data is signups[i] // todo
		// Write to roster sheet
		// todo

	}

})();
