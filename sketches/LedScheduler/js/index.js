/*jslint browser: true*/
/*global $, jQuery, alert*/
var deviceID = "450039000e51353433323633";
var accessToken = "0ad112ded9e5e2a67fd3c2e21ec43556deb8c3d4";
var varName = "ledState";
var ledState;

var startHr;
var startMin;
var endHr;
var endMin;


$(document).ready(function () {
    console.log("ready!");
    getValue();

    $('#submit').click(function () {
        var stHr = ($('#stHr1').val());
        var stMin = ($('#stMin1').val());

        var dur = ($('#dur').val());
        var endHr = stHr + (dur / 60).floor;
        var endMin = dur - (endHr * 60);

        console.log(stHr);
        console.log(stMin);
        particleSetFunc(stHr + " " + stMin + " " + endHr + " " + endMin, "setAlarm");
        //        particleSetFunc(stHr, "setStrtHr1");
        //        particleSetFunc(stMin, "setStrtMin1");
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



function getValue() {
    requestURL = "https://api.particle.io/v1/devices/" + deviceID + "/" + varName + "/?access_token=" + accessToken;
    console.log(requestURL);
    $.getJSON(requestURL, function (json) {
        ledState = json.result;
        updateSwitch();
    });

}

function monitorSchedule() {
    requestURL = "https://api.particle.io/v1/devices/" + deviceID + "/" + "StartHourT1" + "/?access_token=" + accessToken;
    $.getJSON(requestURL, function (json) {
        startHr = json.result;
    });
    requestURL = "https://api.particle.io/v1/devices/" + deviceID + "/" + "StartMinT1" + "/?access_token=" + accessToken;
    $.getJSON(requestURL, function (json) {
        startMin = json.result;
    });
    requestURL = "https://api.particle.io/v1/devices/" + deviceID + "/" + "EndHourT1" + "/?access_token=" + accessToken;
    $.getJSON(requestURL, function (json) {
        endHr = json.result;
    });
    requestURL = "https://api.particle.io/v1/devices/" + deviceID + "/" + "EndMinT1" + "/?access_token=" + accessToken;
    $.getJSON(requestURL, function (json) {
        endMin = json.result;
    });
    document.getElementById("Schedule").innerHTML = "Start: " + startHr + ":" + startMin + " End: " + endHr + ":" + endMin;

}

function updateSchedule() {

    document.getElementById("Schedule").innerHTML = "Start: " + startHr + ":" + startMin + " End: " + endHr + ":" + endMin;

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
