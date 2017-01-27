/*jslint browser: true*/
/*global $, jQuery, alert*/
var deviceID = "xxx";
var accessToken = "xxx";
//declare particle Variables
var valvePower = "ledState";
var analogVal = "analogvalue";

var urlCycleData = 'https://api.thingspeak.com/channels/218438/fields/2/last.txt';

var startHr;
var startMin;
var endHr;
var endMin;

var lastStartHr;
var lastStartMin;
var lastEndHr;
var lastEndMin;


$(document).ready(function () {
    console.log("ready!");
    getPowerStatus(valvePower);
    getLastCycleData();
    window.setInterval(updateScreen(), 1000);

    //this gets called from html button
    $('#submit').click(function () {
        var stHr = parseInt($('#stHr1').val());
        var stMin = parseInt($('#stMin1').val());

        var dur = parseInt($('#dur').val());
        var stopMin = (stMin + dur) % 60;
        var rollover = 0;
        if (dur + stMin >= 60 && dur < 60) {
            rollover = 1; //rollover minutes to hours
        }
        var stopHr = parseInt(stHr) + rollover + Math.floor(dur / 60);

        console.log("start:" + stHr + ":" + stMin);
        console.log("dur:" + dur);
        console.log("end:" + stopHr + ":" + stopMin);
        particleSetFunc(stHr + " " + stMin + " " + stopHr + " " + stopMin, "setAlarm"); //        particleSetFunc(stHr, "setStrtHr1");
        setTimeout(monitorSchedule, 2000);
    });

    $('#getSchedule').click(function () {
        monitorSchedule();
    });


});

//get last cycle data
function getLastCycleData() {
    $.get(urlCycleData, function (data) {
        console.log(data);
        var cycleStringArray = data.split(' ');
        lastStartHr = cycleStringArray[0];
        lastStartMin = cycleStringArray[1];
        lastEndHr = cycleStringArray[2];
        lastEndMin = cycleStringArray[3];
        console.log("last: " + lastStartHr);
    }, 'text');
}

function getPowerStatus(particleVariable) {
    requestURL = "https://api.particle.io/v1/devices/" + deviceID + "/" + particleVariable + "/?access_token=" + accessToken;
    console.log(requestURL);
    $.getJSON(requestURL, function (json) {
        valvePower = json.result;
    });
    monitorSchedule();
}

function monitorSchedule() {
    var timeString;
    requestURL = getRequestUrl("getTimeStrT1");
    $.getJSON(requestURL, function (json) {
        timeString = json.result;
        console.log("raw timeStringT1 = " + timeString);
        var timeStringArray = timeString.split(' ');
        startHr = timeStringArray[0];
        startMin = timeStringArray[1];
        endHr = timeStringArray[2];
        endMin = timeStringArray[3];
        //add padding to make it readable
        if (parseInt(startMin) < 10) {
            startMin = "0" + startMin;
        }
        if (parseInt(endMin) < 10) {
            endMin = "0" + endMin;
        }
        updateScreen();
        console.log("Monitor start:" + startHr + ":" + startMin);
        console.log("Monitor end:" + endHr + ":" + endMin);

    });

}

function updateScreen() {
    $('.inputVal').remove() //remove any previous values on screen

    //update scheduled cycle times
    $("#startTime").append('<b class="inputVal"><br>' + startHr + ":" + startMin + ' </br></b>');
    $("#endTime").append('<b class="inputVal"><br>' + endHr + ":" + endMin + ' </br></b>');
    //    console.log("Schedule set for " + startHr + ":" + startMin + ". Will end at " + endHr + ":" + endMin);
    $("#lastStartTime").append('<b class="inputVal"><br>' + lastStartHr + ":" + lastStartMin + ' </br></b>');
    $("#lastEndTime").append('<b class="inputVal"><br>' + lastEndHr + ":" + lastEndMin + ' </br></b>');

    //update irrigation-system activity status
    if (valvePower == 0) {
        $("#ledState").append('<b class="inputVal"><br> OFF </br></b>');
    } else {
        $("#ledState").append('<mark><b class="inputVal"><br>ON</br></b></mark>');
    }

}

function getRequestUrl(particleVar) {
    var reqURL = "https://api.particle.io/v1/devices/" + deviceID + "/" + particleVar + "/?access_token=" + accessToken;
    return reqURL;
}


function particleSetFunc(newValue, funcName) {
    var setFunc = funcName;
    var requestURL = "https://api.particle.io/v1/devices/" + deviceID + "/" + setFunc + "/";
    $.post(requestURL, {
        params: newValue,
        access_token: accessToken
    });
}
