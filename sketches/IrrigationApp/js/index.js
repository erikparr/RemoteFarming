/*jslint browser: true*/
/*global $, jQuery, alert*/
var deviceID = "450039000e51353433323633";
var accessToken = "0ad112ded9e5e2a67fd3c2e21ec43556deb8c3d4";
//declare particle Variables
var ledState = "ledState";
var analogVal = "analogvalue";
var ledState;

var startHr;
var startMin;
var endHr;
var endMin;


$(document).ready(function () {
    console.log("ready!");
    getValue(ledState);

    $('#submit').click(function () {
        var stHr = parseInt($('#stHr1').val());
        var stMin = parseInt($('#stMin1').val());

        var dur = parseInt($('#dur').val());
        var stopMin = (stMin + dur) % 60;
        var rollover = 0;
        if (dur + stMin >= 60) {
            rollover = 1; //rollover minutes to hours
        }
        var stopHr = parseInt(stHr) + rollover + Math.floor(dur / 60);

        console.log("start:" + stHr + ":" + stMin);
        console.log("end:" + stopHr + ":" + stopMin);
        particleSetFunc(stHr + " " + stMin + " " + stopHr + " " + stopMin, "setAlarm"); //        particleSetFunc(stHr, "setStrtHr1");    //        particleSetFunc(stMin, "setStrtMin1");
        //        particleSetFunc(endHr, "setEndHr1");
        //        particleSetFunc(endMin, "setEndMin1");   
    });

    $('#getSchedule').click(function () {
        monitorSchedule();
    });

    $('#updateSchedule').click(function () {
        updateSchedule();
    });


});



function getValue(particleVariable) {
    requestURL = "https://api.particle.io/v1/devices/" + deviceID + "/" + particleVariable + "/?access_token=" + accessToken;
    console.log(requestURL);
    $.getJSON(requestURL, function (json) {
        ledState = json.result;
        updateSwitch();
    });

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
        console.log("Monitor start:" + startHr + ":" + startMin);
        console.log("Monitor end:" + endHr + ":" + endMin);

    });

    //    //    requestURL = "https://api.particle.io/v1/devices/" + deviceID + "/" + "StartHourT1" + "/?access_token=" + accessToken;
    //    requestURL = getRequestUrl("StartHourT1");
    //    $.getJSON(requestURL, function (json) {
    //        startHr = json.result;
    //    });
    //    //    requestURL = "https://api.particle.io/v1/devices/" + deviceID + "/" + "StartMinT1" + "/?access_token=" + accessToken;
    //    requestURL = getRequestUrl("StartMinT1");
    //    $.getJSON(requestURL, function (json) {
    //        startMin = json.result;
    //    });
    //    //    requestURL = "https://api.particle.io /v1/devices/" + deviceID + "/" + "EndHourT1" + "/?access_token=" + accessToken;
    //    requestURL = getRequestUrl("EndHourT1");
    //    $.getJSON(requestURL, function (json) {
    //        endHr = json.result;
    //    });
    //    //    requestURL = "https://api.particle.io/v1/devices/" + deviceID + "/" + "EndMinT1" + "/?access_token=" + accessToken;    
    //    requestURL = getRequestUrl("EndMinT1");
    //    $.getJSON(requestURL, function (json) {
    //        endMin = json.result;
    //    });    //wait a second for communication to take place
    setTimeout(updateSchedule, 10000);
}

function updateSchedule() {
    if (parseInt(startMin) < 10) {
        startMin = "0" + startMin;
    }
    if (parseInt(endMin) < 10) {
        endMin = "0" + endMin;
    }
    document.getElementById("Schedule").innerHTML = "Start: " + startHr + ":" + startMin + " End: " + endHr + ":" + endMin;
    console.log("Schedule set for " + startHr + ":" + startMin + ". Will end at " + endHr + ":" + endMin);
}

function getRequestUrl(particleVar) {
    var reqURL = "https://api.particle.io/v1/devices/" + deviceID + "/" + particleVar + "/?access_token=" + accessToken;
    return reqURL;
}


function updateSwitch() {
    if (ledState == 0) {
        document.getElementById("switch1").checked = false;
        document.getElementById("ledPower").innerHTML = "led is now OFF";
    } else {
        document.getElementById("switch1").checked = true;
        document.getElementById("ledPower").innerHTML = "led is now ON";
    }

}

function updateTime() {
    var requestURL = "https://api.particle.io/v1/devices/" + deviceID + "/" + setFunc + "/";
    particleSetFunc();

}

function toggleValue(obj) {
    var newValue;
    if (ledState == 1) {
        newValue = 0;
        document.getElementById("ledPower").innerHTML = "led is now OFF";
    } else {
        newValue = 1;
        document.getElementById("ledPower").innerHTML = "led is now ON";

    }
    particleSetFunc(newValue, "led");
    ledState = newValue;

}

function particleSetFunc(newValue, funcName) {
    var setFunc = funcName;
    var requestURL = "https://api.particle.io/v1/devices/" + deviceID + "/" + setFunc + "/";
    $.post(requestURL, {
        params: newValue,
        access_token: accessToken
    });
}
