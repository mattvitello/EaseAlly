var myJson;
var currID = "";
var currIntensity = 0;
var status = "";

setupSlider();
readJSON();

$( ".rangeslider__handle" ).mousedown(function() {
		var item = this;
  		$(window).mouseup(function(){
			var element = $(item).parent().parent().parent().parent()[0];
			var input = $(item).parent().parent().children()[0];
			var id =  "#" + element.getAttribute('id');
			var mySympID = "#my-symptoms #" + element.getAttribute('id');
			var addSympID = "#add-symptoms #" + element.getAttribute('id');

			currID = id;
			currIntensity = input.value;

			console.log("input.value: "+ input.value);

	     	//called when symptom is added
			if(input.value > 0){
		      	$(element).hide();
		      	$(mySympID).css("display", "flex");
		      	var i1 = mySympID + " .col-5 div input";
		      	$(i1).val(input.value).change();
		      	addToJSON();
	    	}

	     	//called when symptom is removed
			else{
		      	$(element).hide();
		      	$(addSympID).css("display", "flex");
		      	var i2 = addSympID + " .col-5 div input";
		      	$(i2).val(0).change();;
		      	removeFromJSON();
			}
  			$(window).unbind('mouseup');
  		});
});

	//on slider change
$('.rangeslider__handle').bind('touchend',function(e){
		e.preventDefault();

		var element = $(this).parent().parent().parent().parent()[0];
		var input = $(this).parent().parent().children()[0];
		var id =  "#" + element.getAttribute('id');
		var mySympID = "#my-symptoms #" + element.getAttribute('id');
		var addSympID = "#add-symptoms #" + element.getAttribute('id');

		currID = id;
		currIntensity = input.value;

     	//called when symptom is added
		if(input.value > 0){
	      	$(element).hide();
	      	$(mySympID).css("display", "flex");
	      	var i1 = mySympID + " .col-5 div input";
	      	$(i1).val(input.value).change();
	      	addToJSON();
    	}

     	//called when symptom is removed
		else{
	      	$(element).hide();
	      	$(addSympID).css("display", "flex");
	      	var i2 = addSympID + " .col-5 div input";
	      	$(i2).val(0).change();;
	      	removeFromJSON();
		}
});

function readJSON(){
	window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, gotFS, fail);
}

function addToJSON(){
	window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, writeFS, fail);
}

function removeFromJSON(){
	window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, removeFS, fail);
}


/**** READING THE FILE ****/
function gotFS(fileSystem) {
	fileSystem.root.getFile("symp.json", null, gotFileEntry, fail);
}
function gotFileEntry(fileEntry) {
	fileEntry.file(gotFile, fail);
}
function gotFile(file){
	readAsText(file);
}
function readAsText(file) {
	var reader = new FileReader();
	reader.onloadend = function(evt) {
		if(evt.target.result == null || evt.target.result == ""){
			window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, gotnewFS, fail);
		}
		else{
			//alert("JSON: " + String(evt.target.result));
			myJson = JSON.parse(String(evt.target.result));

			//var x = "<p>" + JSON.stringify(JSON) + "</p>";
			//$("#error").append(x);

			updateDisplay(); //update display now that json file has been read
			calculateStatus(); //calculate the status of the person
		}
	};
	reader.readAsText(file);
}

/**** INTITIALIZING FILE ****/
function gotnewFS(fileSystem) {
	fileSystem.root.getFile("symp.json", {create: true, exclusive: false}, newFileEntry, fail);
}
function newFileEntry(fileEntry) {
	fileEntry.createWriter(newFileWriter, fail);
}
function newFileWriter(writer) {
	writer.onwriteend = function(evt) {
		console.log("done initializing");
		readJSON();
		calculateStatus();
	}
	writer.write("{\"symptoms\":[]}");
}


/**** WRITING SYMPTOM TO FILE ****/
function writeFS(fileSystem) {
	fileSystem.root.getFile("symp.json", {create: true, exclusive: false}, writeFileEntry, fail);
}
function writeFileEntry(fileEntry) {
	fileEntry.createWriter(writeFileWriter, fail);
}
function writeFileWriter(writer) {
	var update = false;
	var pos;

	for(var i=0; i < myJson['symptoms'].length; i++){
		if(myJson['symptoms'][i].id == currID){
			update = true;
			pos = i;
			break;
		}
	}

	if(update){
		myJson['symptoms'].splice(pos,1);
	}

	myJson['symptoms'].push({"id":currID,"intensity":currIntensity})
	var jsonStr = JSON.stringify(myJson);
	

	writer.onwriteend = function(evt) {
		writer.seek(0);
		writer.onwriteend = function(evt){
			console.log("updated: " + jsonStr);
			calculateStatus();
		}
		writer.write(jsonStr);
	}

	writer.truncate(0);
}

/**** REMOVING SYMPTOM FROM FILE ****/
function removeFS(fileSystem) {
	fileSystem.root.getFile("symp.json", {create: true, exclusive: false}, removeFileEntry, fail);
}
function removeFileEntry(fileEntry) {
	fileEntry.createWriter(removeFileWriter, fail);
}
function removeFileWriter(writer) {
	var update = false;
	var pos;

	for(var i=0; i < myJson['symptoms'].length; i++){
		if(myJson['symptoms'][i].id == currID){
			pos = i;
			break;
		}
	}
	myJson['symptoms'].splice(pos,1);
	var jsonStr = JSON.stringify(myJson);

	writer.onwriteend = function(evt) {
		writer.seek(0);
		writer.onwriteend = function(evt){
			console.log("updated: " + jsonStr);
			calculateStatus();
		}
		writer.write(jsonStr);
	}

	writer.truncate(0);
}


/**** ON FAIL PRINT ERROR ****/
function fail(error) {
	console.log(error.message);

	//if json file does not exist - create it
	if(error.code == 8){
		window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, gotnewFS, fail);
	}
}



function updateDisplay(){
	console.log(myJson);
	for(var i=0; i < myJson['symptoms'].length; i++){
		var myID = "#my-symptoms " + myJson['symptoms'][i].id;
		var addID = "#add-symptoms " + myJson['symptoms'][i].id;
		var vv = parseInt(myJson['symptoms'][i].intensity);

		$(addID).hide();
		$(myID).css("display", "flex");
		var i3 = myID + " .col-5 div input";
		$(i3).val(vv).change();
	}
}

function setupSlider(){
	var $r = $('input[type="range"]');
	var $ruler = $('<div class="hide_me" />');

	// Initialize
	$r.rangeslider({
		polyfill: false,
		onInit: function() {
			$ruler[0].innerHTML = getRulerRange(this.min, this.max, this.step);
			this.$range.prepend($ruler);}
		});

	function getRulerRange(min, max, step) {
		var range = '';
		var i = 0;

		while (i <= max) {
			range += i + ' ';
			i = i + step;
		}
		return range;
	}
}

function calculateStatus(){
	var mild = 0;
	var severe = 0;
	var fatal = 0;

	var symptoms = new Set();

	//add all symptoms to set
	for(var i=0; i < myJson['symptoms'].length; i++){
		var combowombo = myJson['symptoms'][i].id + myJson['symptoms'][i].intensity;
		console.log(combowombo);
		symptoms.add(combowombo);
	}

	//check for fatality first
	if(symptoms.has('#tongue-swelling1') || symptoms.has('#tongue-swelling2') || symptoms.has('#lips-swelling1') || symptoms.has('#lips-swelling2') || symptoms.has('#hives2')){
		fatal++;
	}
	if(symptoms.has('#trouble-breathing1') || symptoms.has('#trouble-breathing2') || symptoms.has('#tight-throat1') || symptoms.has('#tight-throat2')){
		fatal++;
	}
	if(symptoms.has('#pale-or-blue1') || symptoms.has('#pale-or-blue2') || symptoms.has('#faint1') || symptoms.has('#faint2') || symptoms.has('#weak-pulse1') || symptoms.has('#weak-pulse2') || symptoms.has('#dizzy1') || symptoms.has('#dizzy2')){
		fatal++;
	}
	if(symptoms.has('#vomitting1') || symptoms.has('#vomitting2') || symptoms.has('#cramping-abdominal1') || symptoms.has('#cramping-abdominal2')){
		fatal++;
	}	
	if(fatal >= 2){
		status = "You're in a fatal condition. Get to a hospital now!";
		console.log("You're in a fatal condition. Get to a hospital now!");
		return;
	}

	//not fatal so check for mild or severe reaction
	if (symptoms.has('#short-of-breath1') || symptoms.has('#short-of-breath2') || symptoms.has('#wheezing1') || symptoms.has('#wheezing2') || symptoms.has('#repetitive-coughing1') || symptoms.has('#repetitive-coughing2')){
		severe++;
	}
	if (symptoms.has('#pale-or-blue1') || symptoms.has('#pale-or-blue2') || symptoms.has('#faint1') || symptoms.has('#faint2') || symptoms.has('#weak-pulse1') || symptoms.has('#weak-pulse2') || symptoms.has('#dizzy1') || symptoms.has('#dizzy2')){
		severe++;
	}
	if (symptoms.has('#trouble-breathing1') || symptoms.has('#trouble-breathing2') || symptoms.has('#tight-throat1') || symptoms.has('#tight-throat2')){
		severe++;
	}
	if (symptoms.has('#tongue-swelling1') || symptoms.has('#tongue-swelling2') || symptoms.has('#lips-swelling1') || symptoms.has('#lips-swelling2')){
		severe++;
	}
	if (symptoms.has('#hives2') || symptoms.has('#skin-redness1') || symptoms.has('#skin-redness2')){
		severe++;
	}
	if (symptoms.has('#vomitting1') || symptoms.has('#vomitting2') || symptoms.has('#diarrhea1') || symptoms.has('#diarrhea2')){
		severe++;
	}
	if (symptoms.has('#itchy-nose1') || symptoms.has('#itchy-nose2') || symptoms.has('#sneezing1') || symptoms.has('#sneezing2')){
		mild++;
	}
	if (symptoms.has('#itchy-mouth1') || symptoms.has('#itchy-mouth2')){
		mild++;
	}
	if (symptoms.has('#hives1') || symptoms.has('#itchy-body1') || symptoms.has('#itchy-body2')){
		mild++;
	}
	if (symptoms.has('#nausea-discomfort1') || symptoms.has('#nausea-discomfort2')){
		mild++;
	}

	//diagnose the severity
	if(severe > 0){
		status = 'You\'re having a severe reaction. Please seek treatment.';
		console.log('You\'re having a severe reaction. Please seek treatment.');
	}
	else if(mild > 0){
		status = 'You\'re having a mild reaction. Take antihistamines and carefully monitor your symptoms.';
		console.log('You\'re having a mild reaction. Take antihistamines and carefully monitor your symptoms.');
	}
	else{
		status = 'You\'re Looking healthy :)';
		console.log('You\'re Looking healthy :)');
	}

	saveStatus();
}

function saveStatus(){
	window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, statusFS, fail);
}
function statusFS(fileSystem) {
	fileSystem.root.getFile("status.txt", {create: true, exclusive: false}, statusFileEntry, fail);
}
function statusFileEntry(fileEntry) {
	fileEntry.createWriter(statusFileWriter, fail);
}
function statusFileWriter(writer) {

	writer.onwriteend = function(evt) {
		writer.seek(0);
		writer.onwriteend = function(evt){
			console.log("saved status: " + status);
		}
		writer.write(status);
	}
	writer.truncate(0);
}














