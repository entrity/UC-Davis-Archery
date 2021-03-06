var Lesson = {};

MEMBERSHIP_STUDENT_ID_COL = 1 + MEMBERSHIP_FIELDS.indexOf('studentId');
N_BALES             = 15;
N_BALE_OPENINGS     = 4 * N_BALES;
N_BOWS_LEFT_HANDED  = 4;
N_BOWS_RIGHT_HANDED = 30;

(function (Lesson) {

	/* Create new form.
	  Return reference to form.
	  Log form url (col 3) and edit url (col 4)
	*/
	Lesson.Form.create = function (dates) {
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
	/* Return Google Form (not Utils.Form) */
	Lesson.Form.get = function () {
		var properties = PropertiesService.getScriptProperties();
		var formId = properties.getProperty('FORM_ID');
		if (!formId)
			return null;
		var form = FormApp.openById(formId);
		return form;
	}
	/* Get list of dicts */
	Lesson.Form.getSignupsAndSessions = function () {
		var form = Lesson.Form.get();
		var sessions = null;
		var signups = form.getResponses().map(function (formResponse) {
		  var rits = formResponse.getItemResponses();
		  var signup = {
		    'timestamp': formResponse.getTimestamp(),
		    'email': formResponse.getRespondentEmail(),
		  };
		  var i = 0;
		  signup.name      = rits[i++].getResponse().trim();
		  signup.studentId = rits[i++].getResponse().trim();
		  if (/buy.+shirt/i.test(rits[i].getItem().getTitle()))
		    signup.tshirt    = rits[i++].getResponse();
		  // Handle dates/sessions input
		  var self = this;
		  if (!sessions) {
		    var sessionNames = rits[i].getItem().asMultipleChoiceItem().getChoices().map(function (c) {return c.getValue()});
		    sessions = sessionNames.map(function (name) { return new Session(name) });
		  };
		  signup.preferredSession = rits[i++].getResponse();
		  if (/CAN.+attend/i.test(rits[i].getItem().getTitle()))
		    signup.waitlist = rits[i++].getResponse().toString().split(/,\s*/).sort(function (a,b) {
		      (a == signup.preferredSession) - (b == signup.preferredSession)
		    }).map(function (sessName) {
		      return sessName.replace(/\s*\([0-9]+ openings\)/,'');
		    });
		    
		  if (/How many sessions/i.test(rits[i].getItem().getTitle())) {
		    signup.maxRegistrations = parseInt(/\d+/.exec(rits[i++].getResponse())[0]);
		  }
		  // Handle fields after dates/sessions
		  if (/paid member/i.test(rits[i].getItem().getTitle()))
		    signup.isMember       = rits[i++].getResponse() != 'No';
		  if (rits[i] && /borrow.+bow/.test(rits[i].getItem().getTitle())) {
		    signup.borrowBow      = rits[i++].getResponse();
		    signup.borrowRightBow = /right/i.test(signup.borrowBow);
		    signup.borrowLeftBow  = /left/i.test(signup.borrowBow);
		    signup.borrowBow      = ! /No/i.test(signup.borrowBow);
		  }
		  if (rits[i] && /returning.+sight/i.test(rits[i].getItem().getTitle()))
		    signup.borrowOR       = rits[i++].getResponse();
		  if (rits[i] && /returning.+compound/i.test(rits[i].getItem().getTitle()))
		    signup.borrowCompound = rits[i++].getResponse();
		  // Return
		  return signup;
		});
		return [signups, sessions];
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

	function getTextForEmailAsArray (datestrs) {
		var lines = [
			"Sign up for this week's lesson! (See the link below.) You MUST submit the form to be eligible to shoot on a \"lesson\" day.",
			"The signup form will close Friday at noon (or earlier, if we notice that all the openings are taken). If you want to attend the lesson, please sign up early!",
			"Please be aware that fall time brings us more signups than we have equipment to accommodate, so we will notify you by email to tell you whether we can accommodate you and when to arrive.",
			"Lesson Times:",
			];
		for (var i in datestrs)
			lines.push(Utilities.formatString("%30s from %8s to %8s<br>%30s from %8s to %8s<br>",
				datestrs[i], '9:15am', '11:15am', datestrs[i], '11:15am', '1:00pm'));
    	return lines;
	}

	/* Get array of datestrings for this week's lesson(s) */
	function getDatestrs () {
		var tmpdatestrs = Log.getLatestDateStrings();
		var dates = tmpdatestrs.map(function(s){ return new Date(s) });
		return dates.map(function(d) { return Utilities.formatString('%s, %s %d', DAYS[d.getDay()], MONTHS[d.getMonth()], d.getDate()) });
	}

	/* Constructor */
	function Session (name) {
		this.name          = name;
		this.nTargets      = N_BALE_OPENINGS;
		this.nLeftBows     = N_BOWS_LEFT_HANDED;
		this.nRightBows    = N_BOWS_RIGHT_HANDED;
		this.registrations = [];
	}

	Lesson.createRoster = function () {
		// Update membership spreadsheet
		Membership.Sheet.updateFromForm();
		// Update attendance spreadsheet
		Membership.Sheet.Attendance.updateFromRosters();
		// Get signup form responses
		var [signups, sessions] = Lesson.Form.getSignupsAndSessions();
		// Augment signup form responses with membership data
		var b2hByName  = Membership.Sheet.getCompletedB2H();
		var attendance = new Utils.Sheet(MEMBERSHIP_SHEET_ID, 'Attendees').by('studentId');
		var payment    = new Utils.Sheet(MEMBERSHIP_SHEET_ID, 'Membership Fees').by('studentId');
		for (var i in signups) {
			var rec          = signups[i];
			rec.b2h          = !! b2hByName[rec.name];
			rec.attendanceCt = attendance[rec.studentId].attendanceCt;
			rec.signupCt     = attendance[rec.studentId].signupCt;
			rec.isPaid       = payment[rec.studentId]['Membership Type'];
		}
		// Run Ford Fulkerson algorithm to achieve max flow
		var net = new ResidualNetwork(sessions, signups);
		net.fordFulkerson(); // net.users[i].data is signups[i]
		// Output spreadsheet of reservations

		// Output roster spreadsheet

	}

})(Lesson);