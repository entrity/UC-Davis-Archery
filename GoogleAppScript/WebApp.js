VERSION = '0.1';
ENCRYPTION_KEY = 'archery.ucd';

function handleRequest(arg) {
  var ret;
  var needsEncryption = true;
  var job = arg.parameter.j;
  
  if (job) {
    if (/roster.*(email|mutt)/i.test(job))
      ret = getRosterEmails();
    else if (/fbsignup/i.test(job)) {
      ret = mainComposeFacebookPost();
      needsEncryption = false;
    } else if (/b2h/i.test(job))
      ret = getB2HEmails();
    else {
      ret = 'v'+VERSION+' - '+JSON.stringify(arg);
      needsEncryption = false;
    }
  } else {
    ret = 'v'+VERSION+' - '+'I am Bagu. I am Error. --- '+CryptoJS.AES.encrypt('plaintext', 'test').toString();
    needsEncryption = false;
  }
//  if (needsEncryption) ret = encrypt(ret);
  return ContentService.createTextOutput(ret);
}
function doGet(arg) {
  return handleRequest(arg);
}
function doPost(arg) {
  return handleRequest(arg);
}

/* Decrypt on command line with: echo <ciphertex> |openssl enc -d -a -aes256 -pass pass:test */
function encrypt(plaintext) {
  return CryptoJS.AES.encrypt(plaintext, ENCRYPTION_KEY).toString();
}

function getRosterEmails() {
  return buildAttendanceEmails().reduce(function (acc, obj, idx) {
    return acc + '\n' + obj.mutt;
  }, '');
}

function getB2HEmails() {
  var dict = new SheetData(ATTENDANCE_SPREADSHEET_ID, 0, 'studentId').dict;
  var bccs = Object.keys(dict).reduce(function (acc, studentId) {
    var archer = dict[studentId];
    if (archer.attendanceCt && !archer['b2h']) acc += Utilities.formatString(' -b "%s"', archer.email);
    return acc;
  }, '');
  var htmlBody = "<p>Dear archer,</p><p>I'm emailing to notify you that we don't have a record of you completing B2H (liability waiver for UC Davis Sports Clubs) for 2018-2019 the academic year. Would you please email us to let us know if our records are in error? If not, please take the following steps to complete B2H <em>before you shoot next</em>. This requirement is levied by UC Davis Sports Clubs. It requires you to pay a fee, but the archery club receives no portion of that fee.</p>"
  + "<ol><li>Visit the Activity List on the myrecreation store: <a href=\"https://myrecreation.ucdavis.edu/store/index.aspx?view=activity&Unit=60\">https://myrecreation.ucdavis.edu/store/index.aspx?view=activity&Unit=60</a></li>"
  + "<li>Click \"Add to Cart\" on the row which holds \"Archery Club (Admin Fee)\"</li>"
  + "<li>Complete the purchase of the admin fee ($20).</li></ol>"
  + EMAIL_SIGNATURE;
  return Utilities.formatString("REPLYTO=%s mutt -F 365muttrc -s 'B2H required to stay in archery' %s <<< \"%s\"",
                                 CLUB_EMAIL_ADDR, bccs, htmlBody.replace(/"/g,'\\"').replace(/ +/g,' ').replace(/\$/g,'\\$'));
}
