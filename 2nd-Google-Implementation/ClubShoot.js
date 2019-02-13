var ClubShoot = {};

(function () {

	SPREADSHEET_URL = 'https://docs.google.com/spreadsheets/d/11TvCpEpz-oK0Ag5ErLJ4s8z9SfRu1IGwieTq0eqbLgQ/edit#gid=594266922'
	SPREADSHEET_ID = '11TvCpEpz-oK0Ag5ErLJ4s8z9SfRu1IGwieTq0eqbLgQ';

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
	function getSignupsAndSessionsFromForm() {
		var form = ClubShoot.getForm();
		if (form) {
			var sessions = {}; // Dict of session labels
			// Make map of form items
			var items = form.getItems().reduce(function(acc,it){
				var tit  = it.getTitle();
				if (/name/i.test(tit))
					acc.name = it;
				else if (/student.*id/i.test(tit))
						acc.studentId = it;
				else if (/t.*shirt/i.test(tit))
						acc.tShirt = it;
				else if (/most like to attend/i.test(tit))
						acc.preferredSession = it;
				else if (/can attend/i.test(tit))
						acc.allSessions = it;
				else if (/how many sessions/i.test(tit))
						acc.maxRegistrations = it;
				else if (/borrow.*bow/i.test(tit))
						acc.borrowBow = it;
				else if (/use a sight/i.test(tit))
						acc.borrowOR = it;
				else if (/use a compound/i.test(tit))
						acc.borrowCompound = it;
				return acc;
			}, {});
			// Make list of form responses
			function toBool(val) { return /yes/i.test(val) }
			function toInt(val) { return parseInt(val.replace(/\D/g,'')) }
			var responses = form.getResponses().map(function(res,i) {
				var out = {};
				Object.keys(items).reduce(function (acc, key) {
					itemResponse = res.getResponseForItem(items[key])
					out[key] = itemResponse && itemResponse.getResponse();
				});
				out.timestamp        = res.getTimestamp();
				out.email            = res.getRespondentEmail();
				out.tShirt           = out.tShirt && out.tShirt.replace(/\(.*\)/,'');
				out.maxRegistrations = toInt(out.maxRegistrations)
				out.borrowBow        = toBool(out.borrowBow);
				out.borrowOR         = toBool(out.borrowOR);
				out.borrowCompound   = toBool(out.borrowCompound);
				// Create ordered waitlist
				out.waitlist = out.preferredSession ? [out.preferredSession] else [];
				var selectedSessions = {};
				for (var i in out.allSessions)
					selectedSessions[out.allSessions[i]] = true;
				if (out.preferredSession) selectedSessions[out.preferredSession] = true;
				Object.assign(sessions, selectedSessions); // Update session labels collections
				delete selectedSessions[out.preferredSession];
				out.waitlist = out.waitlist.concat(Object.keys(waitlist));
				return out;
			});
			return [responses, Object.keys(sessions)];
		}
		return false;
	}
	function runFordFulkerson() {
		// Get signup form responses
		var [signups, sessions] = getSignupsAndSessions();
		// Add membership info
		var membershipByStudentId = Membership.byStudentId();
		var attendanceByStudentId = Membership.attendanceByStudentId();
		for (var i in signups) {
			var studentId = signups[i].studentId;
			var payment = membershipByStudentId[studentId]['Payment'];
			signups[i].isMember = (/\$100/.test(payment) || /winter/i.test(payment));
			signups[i].attendance = attendanceByStudentId[studentId];
		}
		/* Ford Fulkerson code uses the following:
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
		// Convert sessions to objects for Ford Fulkerson
		sessions = sessions.map(function (val) {
			return {name: label};
		});
		// Convert signups to 'users' for Ford Fulkerson
		var users = signups.map(function (val) {
			return {name: val.name, data: val};
		});
		// Run Ford Fulkerson algorithm to achieve max flow
		var net = new ResidualNetwork(sessions, signups);
		net.fordFulkerson(); // net.users[i].data is signups[i]
		return net;
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
	// Search in Spreadsheet for any scheduled dates in range, return date strings
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
	// Close the signup form, update status
	ClubShoot.closeForm = function () {
		var form = getForm();
		if (form) {
			form.setAcceptingResponses(false);
			Properties.set(FORM_STATUS_KEY, STATUS_CLOSED);
		}
		return !!form;
	}
	ClubShoot.createRoster = function () {
		var net = runFordFulkerson(); // net.users[i].data is signups[i]
		// Build matrix of rows for spreadsheet
		function userToRow(data) { // todo
			var row = [];
			row.append(''); // attendance

		}
		// todo
	}

})();
