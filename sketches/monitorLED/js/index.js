/*jslint browser: true*/
/*global $, jQuery, alert*/
var deviceID = "xxxx";
var accessToken = "xxxxx";
var varName = "ledState";
var ledState;


$(document).ready(function () {
    console.log("ready!");
    getValue();
});

function getValue() {
    requestURL = "https://api.particle.io/v1/devices/" + deviceID + "/" + varName + "/?access_token=" + accessToken;
    console.log(requestURL);
    $.getJSON(requestURL, function (json) {
        ledState = json.result;
        updateSwitch();
    });

}


function getValue() {
    requestURL = "https://api.particle.io/v1/devices/" + deviceID + "/" + varName + "/?access_token=" + accessToken;
    console.log(requestURL);
    $.getJSON(requestURL, function (json) {
        ledState = json.result;
        updateSwitch();
    });

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

function toggleValue(obj) {
    var newValue;
    if (ledState == 1) {
        newValue = 0;
        document.getElementById("ledPower").innerHTML = "led is now OFF";
    } else {
        newValue = 1;
        document.getElementById("ledPower").innerHTML = "led is now ON";

    }
    particleSetLed(newValue);
}

function particleSetLed(newValue) {
    var setFunc = "led"
    var requestURL = "https://api.particle.io/v1/devices/" + deviceID + "/" + setFunc + "/";
    $.post(requestURL, {
        params: newValue,
        access_token: accessToken
    });
    ledState = newValue;
}
