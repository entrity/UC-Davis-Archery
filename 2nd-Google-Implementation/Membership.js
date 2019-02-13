var Membership = {};

(function () {
	MEMBERSHIP_SHEET_ID = '1oXwQN1Bf22RCARJ8Uz5RHxSb_-J8g8S86UAhNZLbhaU';

	// Read from "Katie Tab"
	Membership.byStudentId = function () {
		return Spreadsheet.toDict(MEMBERSHIP_SHEET_ID, 'Katie Tab', 'Student ID');
	}
	Membership.attendanceByStudentId = function () {
		/* This tab should be manually updated each week */
		return Spreadsheet.toDict(MEMBERSHIP_SHEET_ID, 'Attendees', 'studentId');
	}

})();