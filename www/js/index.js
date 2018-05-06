document.addEventListener('deviceready', this.onDeviceReady, false);
var myJson;
var count = 0;
var currID = "";
var currIntensity = 0;
var status = "";
var spo2 = 0;
var deviceId = "4CF260AF-D5E1-BFAE-A3CC-F34FFE2E8FD0";

var bluefruit = {
    serviceUUID: '6e400001-b5a3-f393-e0a9-e50e24dcca9e',
    txCharacteristic: '6e400002-b5a3-f393-e0a9-e50e24dcca9e', // transmit is from the phone's perspective
    rxCharacteristic: '6e400003-b5a3-f393-e0a9-e50e24dcca9e'  // receive is from the phone's perspective
};

function onDeviceReady(){
	$("#monitor-p").show();
	$("#add-p").hide();
	$("#mild-info-p").hide();
	$("#severe-info-p").hide();
	$("#bluetooth-p").hide();
	$("#history-p").hide();
	$("#settings-p").hide();
	monitor();
	setupBluetooth();
}


/************ MONITOR PAGE ****************/

function gotFSMonitor(fileSystem) {
	fileSystem.root.getFile("status.txt", null, gotFileEntryMonitor, failMonitor);
}
function gotFileEntryMonitor(fileEntry) {
	fileEntry.file(gotFileMonitor, failMonitor);
}
function gotFileMonitor(file){
	readAsTextMonitor(file);
}
function readAsTextMonitor(file) {
	var reader = new FileReader();
	reader.onloadend = function(evt) {
		var result = evt.target.result;
		var outNum = result.match(/\d+$/)[0];
		$("#num-symps").html(String(outNum));

		status = result.replace(/[0-9]/g, '');
		updateStatus(status);
	};
	reader.readAsText(file);
}

function failMonitor(error) {
	status = error.message;
	$("#status-content").html(status);
	console.log(error.message);
}

function updateStatus(status){
	if($('#ingest-checkbox').prop( "checked" )){
		status = "SEVERE REACTION";
	}

	if(String(status) == "NO REACTION DETECTED"){
		$("#status-content").html(String(status));
		$("#s-graph").attr("src","img/monitor/good-status.png");
		$("#s-circle").attr("src","img/monitor/good-spo2.png");

		$("#status-content").removeClass();
		$("#status-content").addClass("no-reaction");

		$("#s-arrow").hide();
	}
	else if(String(status) == "MILD REACTION"){
		$("#status-content").html(String(status));
		$("#s-graph").attr("src","img/monitor/mild-status.png");
		$("#s-circle").attr("src","img/monitor/mild-spo2.png");

		$("#status-content").removeClass();
		$("#status-content").addClass("mild-reaction");

		$("#s-arrow").show();
		$("#s-arrow").attr("src","img/monitor/mild-arrow.png");
		$("#s-arrow").removeClass();
		$("#s-arrow").addClass("mild-a");
	}
	else if(String(status) == "SEVERE REACTION"){
		$("#status-content").html(String(status));
		$("#s-graph").attr("src","img/monitor/severe-status.png");
		$("#s-circle").attr("src","img/monitor/severe-spo2.png");

		$("#status-content").removeClass();
		$("#status-content").addClass("severe-reaction");

		$("#s-arrow").show();
		$("#s-arrow").attr("src","img/monitor/severe-arrow.png");
		$("#s-arrow").removeClass();
		$("#s-arrow").addClass("severe-a");
	}
	else{
		$("#status-content").html("NO REACTION DETECTED");
		$("#s-graph").attr("src","img/monitor/good-status.png");
		$("#s-circle").attr("src","img/monitor/good-spo2.png");

		$("#status-content").removeClass();
		$("#status-content").addClass("no-reaction");

		$("#s-arrow").hide();
	}
}


/******* MONITOR PAGE BLUETOOTH **********/
function bytesToString(buffer) {
    return String.fromCharCode.apply(null, new Uint8Array(buffer));
}

function setupBluetooth(){
	ble.isEnabled(
		//bluetooth is enabled
	    function() {

	    	ble.isConnected(
			    deviceId,
			    //connected to bluetooth
			    function() {					
			        BleConnected();
			    },

			    //not connected to bluetooth
			    function() {
			        BleNotConnected();
			    }
			);
	        
	    },

	    //bluetooth is not enabled
	    function() {
	        BleNotConnected();
	    }
	);
}


function BleNotConnected(){
	//gray out icon on home page
	$(".bluetooth-btn").attr("src","img/bluetooth-no.png");
	$("#spo2-val").html("N/A");
	spo2 = -1;
}

function BleConnected(){
	//make icon solid
	$(".bluetooth-btn").attr("src","img/bluetooth-yes.png");

	//call start notification
	ble.startNotification(deviceId, "6e400001-b5a3-f393-e0a9-e50e24dcca9e", "6e400003-b5a3-f393-e0a9-e50e24dcca9e", onData, onError);
}

var onData = function(data) {
	$("#spo2-val").html(bytesToString(data));
	spo2 = parseFloat(bytesToString(data));
	if(bytesToString(data) != 'N/A'){
		if(spo2 < 90){
			updateStatus("SEVERE REACTION");			//set to severe reaction
		}
	}
}

var onError = function(reason) {
	alert("ERROR: " + JSON.stringify(reason)); // real apps should use notification.alert
}


/*************** ADD PAGE ****************/


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
			try{
				myJson = JSON.parse(String(evt.target.result));
			}
			catch(err){
				var relativeFilePath = "symp.json";
				window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, function(fileSystem){
					fileSystem.root.getFile(relativeFilePath, {create:false}, function(fileEntry){
						fileEntry.remove(function(file){
							console.log("File removed!");
						},function(){
							console.log("error deleting the file " + error.code);
						});
					},function(){
						console.log("file does not exist");
					});
				},function(evt){
					console.log(evt.target.error.code);
				});

				readJSON();
			}

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
	fileSystem.root.getFile("symp.json", null, writeFileEntry, fail);
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
			//console.log("updated: " + jsonStr);

			calculateStatus();
		}
		writer.write(jsonStr);
	}

	writer.truncate(0);
}

/**** REMOVING SYMPTOM FROM FILE ****/
function removeFS(fileSystem) {
	fileSystem.root.getFile("symp.json", null, removeFileEntry, fail);
}
function removeFileEntry(fileEntry) {
	fileEntry.createWriter(removeFileWriter, fail);
}
function removeFileWriter(writer) {
	var update = false;
	var pos = 1000;

	for(var i=0; i < myJson['symptoms'].length; i++){
		if(myJson['symptoms'][i].id == currID){
			pos = i;
			break;
		}
	}
	if(pos != 1000){
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
}


/**** ON FAIL PRINT ERROR ****/
function fail(error) {
	console.log(error.message);
	//if json file does not exist - create it
	if(error.code == 8 || error.code == 1){
		window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, gotnewFS, fail);
	}
}



function updateDisplay(){
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
	var numSymptoms = myJson['symptoms'].length;
	//add all symptoms to set
	for(var i=0; i < myJson['symptoms'].length; i++){
		var combowombo = myJson['symptoms'][i].id + myJson['symptoms'][i].intensity;
		//console.log(combowombo);
		symptoms.add(combowombo);
	}

	//check for fatality first
	if(symptoms.has('#tongue-swelling1') || symptoms.has('#tongue-swelling2') || symptoms.has('#lips-swelling1') || symptoms.has('#lips-swelling2') || symptoms.has('#hives2')){
		fatal++;
		severe++;
	}
	if(symptoms.has('#trouble-breathing1') || symptoms.has('#trouble-breathing2') || symptoms.has('#tight-throat1') || symptoms.has('#tight-throat2')){
		fatal++;
		severe++;
	}
	if(symptoms.has('#pale-or-blue1') || symptoms.has('#pale-or-blue2') || symptoms.has('#faint1') || symptoms.has('#faint2') || symptoms.has('#weak-pulse1') || symptoms.has('#weak-pulse2') || symptoms.has('#dizzy1') || symptoms.has('#dizzy2')){
		fatal++;
		severe++;
	}
	if(symptoms.has('#vomitting1') || symptoms.has('#vomitting2') || symptoms.has('#cramping-abdominal1') || symptoms.has('#cramping-abdominal2')){
		fatal++;
		severe++;
	}	
	/*if(fatal >= 2){
		status = "You're in a fatal condition. Get to a hospital now!";
		console.log("You're in a fatal condition. Get to a hospital now!");
		return;
	}*/

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
	if (symptoms.has('#vomitting1') || symptoms.has('#vomitting2') || symptoms.has('#11') || symptoms.has('#diarrhea2')){
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

	var oldStatus = status;
	//diagnose the severity
	if(severe > 0){
		status = 'SEVERE REACTION' + numSymptoms;
		console.log('SEVERE REACTION');
	}
	else if(mild > 0){
		status = 'MILD REACTION' + numSymptoms;
		console.log('MILD REACTION');
	}
	else{
		status = 'NO REACTION DETECTED' + numSymptoms;
		console.log('NO REACTION DETECTED');
	}

	oldStatus = oldStatus.replace(/[0-9]/g, '');
	newStatus = status.replace(/[0-9]/g, '');
	if(oldStatus != newStatus && !($('#ingest-checkbox').prop( "checked" ))){
		$("#monitor-icon").attr("src","img/monitor-notif.png");
		//change monitor icon to be a notifcation
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




/********** CLICK FUNCTIONS ************/

$(document).on("touchstart", '#add-tab', function(event) { 
	$("#monitor-p").hide();
	$("#severe-info-p").hide();
	$("#mild-info-p").hide();
	$("#add-p").show();
	$("#bluetooth-p").hide();
	//$.getScript("/js/add.js");

	add();
});

$(document).on("touchstart", '#monitor-tab', function(event) { 
	$("#monitor-p").show();
	$("#severe-info-p").hide();
	$("#mild-info-p").hide();
	$("#add-p").hide();
	$("#bluetooth-p").hide();

	monitor();
});

$(document).on("touchstart", '#history-tab', function(event) { 
	$("#monitor-p").hide();
	$("#severe-info-p").hide();
	$("#mild-info-p").hide();
	$("#add-p").hide();
	$("#bluetooth-p").hide();

	history();
});

$(document).on("touchstart", '#settings-tab', function(event) { 
	$("#monitor-p").hide();
	$("#severe-info-p").hide();
	$("#mild-info-p").hide();
	$("#add-p").hide();
	$("#bluetooth-p").hide();

	settings();
});

$(document).on("touchstart", '.mild-a', function(event) { 
	$("#monitor-p").hide();
	$("#severe-info-p").hide();
	$("#mild-info-p").show();
	$("#monitor-icon").attr("src","img/monitor.png");
	$("#monitor-container").removeClass('active');
});

$(document).on("touchstart", '.severe-a', function(event) { 
	$("#monitor-p").hide();
	$("#mild-info-p").hide();
	$("#severe-info-p").show();
	$("#monitor-icon").attr("src","img/monitor.png");
	$("#monitor-container").removeClass('active');
});

$(document).on("touchstart", '#back-btn', function(event) { 
	$("#monitor-p").show();
	$("#severe-info-p").hide();
	$("#mild-info-p").hide();
	$("#add-p").hide();
	$("#bluetooth-p").hide();

	monitor();
});

$(document).on("touchstart", '.bluetooth-btn', function(event) { 
	$("#monitor-p").hide();
	$("#bluetooth-p").show();
	$("#monitor-icon").attr("src","img/monitor.png");
	$("#monitor-container").removeClass('active');

	checkBluetooth();
});

$(document).on("touchstart", '#refreshButton', function(event) { 
	refreshDeviceList();
});

$(document).on("touchstart", '#disconnectButton', function(event) { 
	disconnect(event);
});

$(document).on("touchstart", '#deviceList', function(event) {
	connect(event);
});

$(document).on("touchstart", '#deviceList', function(event) {
	connect(event);
});


//checkbox
$('#ingest-checkbox').change(function(){
	var status_x = status.replace(/[0-9]/g, '');

	if(this.checked){
		if(status_x != "SEVERE REACTION"){
			$("#monitor-icon").attr("src","img/monitor-notif.png");		//add notification
			updateStatus("SEVERE REACTION");
		}
		console.log("checked");
	}
	else{
		//add notification
		window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, gotFSMonitor, fail);
		if(status_x != "SEVERE REACTION"){
			console.log("new status: " + status_x);
			$("#monitor-icon").attr("src","img/monitor-notif.png");		//add notification
		}
		console.log("not checked");
	}
});



function add(){
	changeTab("add");
	setupSlider();
	readJSON();

	if(count == 0){
		count = count + 1;

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
	}
}


function monitor(){
	changeTab("monitor");

	window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, gotFSMonitor, fail);
	setupBluetooth();
}

function history(){
	changeTab("history");
}

function settings(){
	changeTab("settings");
}


function changeTab(id){
	$("#add-icon").attr("src","img/add.png");
	$("#add-container").removeClass('active');
	$("#monitor-icon").attr("src","img/monitor.png");
	$("#monitor-container").removeClass('active');
	$("#history-icon").attr("src","img/history.png");
	$("#history-container").removeClass('active');
	$("#settings-icon").attr("src","img/settings.png");
	$("#settings-container").removeClass('active');

	if (id == "monitor"){
		$("#monitor-icon").attr("src","img/monitor-active.png");
		$("#monitor-container").addClass('active');
	}
	else if (id == "add"){
		$("#add-icon").attr("src","img/add-active.png");
		$("#add-container").addClass('active');
	}
	else if (id == "history"){
		$("#history-icon").attr("src","img/history-active.png");
		$("#history-container").addClass('active');
	}
	else if(id == "settings"){
		$("#settings-icon").attr("src","img/settings-active.png");
		$("#settings-container").addClass('active');
	}

}


/***** BLUETOOTH PAGE *******/

//call on bluetooth button press
function checkBluetooth(){
	ble.isEnabled(
		//bluetooth is enabled
	    function() {
	    	ble.isConnected(
			    deviceId,

			    //connected to bluetooth
			    function() {
			        bluetoothConnected();
			    },

			    //not connected to bluetooth
			    function() {
			        bluetoothNotConnected();
			    }
			);
	        
	    },

	    //bluetooth is not enabled
	    function() {
	        bluetoothOff();
	    }
	);
}

function bluetoothOff(){
	//tell the user to turn on their bluetooth
	showConnectPage();
	$("#bleWarning").show();
}

function bluetoothConnected(){
	//show bluetooth connection and the disconnect button
	$("#bleWarning").hide();
	//var deviceId = $("#disconnectButton").data("deviceId");
	showConnectedPage();

}

function bluetoothNotConnected(){
	showConnectPage();
	$("#bleWarning").hide();
	//show possible connections and allow user to connect
	refreshDeviceList();
}



//call when refresh button hit
function refreshDeviceList() {
	$("#deviceList").html('');
	ble.scan([bluefruit.serviceUUID], 5, onDiscoverDevice, onError);
}

var onDiscoverDevice = function(device) {
	$("#bleWarning").hide();
	var listItem = document.createElement('li'),
		html = '<b>' + device.name + '</b><br/>' +
		'RSSI: ' + device.rssi + '&nbsp;|&nbsp;' +
		device.id;

	listItem.dataset.deviceId = device.id;
	listItem.innerHTML = html;
	$("#deviceList").append(listItem);
}



//call when list item clicked
function connect(e) {
	deviceId = e.target.dataset.deviceId;
	var onConnect = function(peripheral) {
		//determineWriteType(peripheral);

		//ble.startNotification(deviceId, bluefruit.serviceUUID, bluefruit.rxCharacteristic, app.onData, app.onError);

		$("#disconnectButton").data("deviceId", deviceId);
		disconnectButton.dataset.deviceId = deviceId;

		showConnectedPage();
	};

	ble.connect(deviceId, onConnect, onError);
}

function determineWriteType(peripheral) {
// Adafruit nRF8001 breakout uses WriteWithoutResponse for the TX characteristic
// Newer Bluefruit devices use Write Request for the TX characteristic

	var characteristic = peripheral.characteristics.filter(function(element) {
		if (element.characteristic.toLowerCase() === bluefruit.txCharacteristic) {
			return element;
		}
	})[0];

	if (characteristic.properties.indexOf('WriteWithoutResponse') > -1) {
		app.writeWithoutResponse = true;
	} else {
		app.writeWithoutResponse = false;
	}
}

//call when disconnect button pressed
function disconnect(event) {
	var deviceId = event.target.dataset.deviceId;
	ble.disconnect(deviceId, showConnectPage, onError);
}


function showConnectPage(){
	$("#connectPage").show();
	$("#connectedPage").hide();
}

function showConnectedPage(){
	$("#connectPage").hide();
	$("#connectedPage").show();
}
























