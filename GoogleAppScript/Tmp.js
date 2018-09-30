function myFunction(bar) {
  Logger.log('playerArray[3]4')
  var f = FormApp.openByUrl('https://docs.google.com/forms/d/1fnQs_5CBdWqBgL2t03dkuSyC3tVALTYQy2VD_7RSgPg/edit');
//  var f = FormApp.openById('1FAIpQLSfKY5ZaOyazgrYkLivna8r0xGdf0NniDGbMvN5SBmx3tTFEDw');
  var items = f.getItems();
  var sel = '2018-09-06 11:15am (99 spots)'
  var pattern = sel.replace(/\s+\(.*/, '');
  for (var i in items) {
    var item = items[i];
   if (item.getTitle() == 'Which session would you like to attend?') {
     Logger.log('ok');
     item = item.asMultipleChoiceItem();
     var old = item.getChoices();
     var upd = []
     for (var c in old) {
       var s = old[c].getValue().toString()
       if (s.match(pattern)) {
         var seats = parseInt(s.match(/\((\d+)/)[1]) - 1;
         if (seats > 31)
         upd.push(s.replace(/\(\d+/, '('+seats));
       }
       else upd.push(s);
     }
     item.setChoiceValues(upd);
   } 
  }
}
