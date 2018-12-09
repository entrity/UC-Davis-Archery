function CronCreateClubShootForm () {
	var from = new Date();
	from.setDate(from.getDate() - from.getDay() + 3); // Get Wednesday of current week
	Logger.log('from %s', from.toString())
	var until = new Date(from);
	until.setDate(from.getDate() + 7); // Get a week from 'from' date
	Logger.log('until %s', until.toString());
	var dateStrings = ClubShoot.getScheduledDateStrings(from, until);
	ClubSession.createForm(dateStrings);
}
function CronCloseClubShootForm () {
	if (ClubSession.closeForm())
		ClubSession.createRoster();
}
function SendClubShootLinkEmail () {
	ClubSession.sendSignupEmail();
}
