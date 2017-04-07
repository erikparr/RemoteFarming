/*jslint browser: true*/
/*global $, jQuery, alert*/
//var deviceID = "3b003b000951343334363138";
//var deviceID = "450039000e51353433323633"; 
var deviceID = "2e0043001951343334363036";
var accessToken = "b427f562daa91b5a02d16a429740de7c762ce53d";

var urlLastCycleData = 'https://api.thingspeak.com/channels/218438/fields/7/last.txt';

var battery = 1;
var connectStatus = -1; // is the particel board communicating?
var isConnected = false;
var alarmBtStatus = false;
$(document).ready(function () {

    //    updateParticleStatus("deviceID"); // we can get the real deviceID but for now its just hard-coded to save BW
    updateParticleStatus("tankLiters");
    updateParticleStatus("volt");
    updateParticleStatus("active");


    $("#activate-button").click(function () {
        console.log("value: " + $(this).val);

        //particleSetCycle(alarmBtStatus.toString(), "setActive");
    });

});

function updateParticleStatus(particleVariable) {
    var result;
    requestURL = "https://api.particle.io/v1/devices/" + deviceID + "/" + particleVariable + "/?access_token=" + accessToken;
    $.getJSON(requestURL, function (json) {
            result = json.result;
        })
        .done(function () {
            console.log(particleVariable + " status: " + result);
            connectStatus = 1;
            if (!isConnected) {
                displayParticleStatus(1); //display green background on success
                isConnected = true;
            }
        })
        .fail(function () {
            console.log("error");
            connectStatus = 0;
            displayParticleStatus(0); //display red background on fail
        })
        .always(function () {
            runningStatus = result;
            console.log(particleVariable + " status complete");
            if (particleVariable == "tankLiters") {
                displayTankVolume(parseInt(result));
            }
            if (particleVariable == "volt") {
                displayBatteryVolt(parseFloat(result).toFixed(2));
            }
            if (particleVariable == "active") {
                displayAlarmStatus(result);
            }
        });

}




function particleSetCycle(cycleString, funcName) {
    console.log("out to particle: " + cycleString);
    var setFunc = funcName;
    var requestURL = "https://api.particle.io/v1/devices/" + deviceID + "/" + setFunc + "/";
    $.post(requestURL, {
            params: cycleString,
            access_token: accessToken
        })
        .done(function () {
            console.log("set-Alarm success");
        })
        .fail(function () {
            console.log("set-Alarm error");
        })
        .always(function () {
            console.log("complete");
            updateParticleStatus("active");

        });

}


function displayTankVolume(tankVolume) {

    $(".tankSensor-box").replaceWith('<span class="tankSensor-box" id="tankSensor">' + tankVolume.toString() + ' </span>');
    //    $('<span class="tankSensor-box" id="tankSensor">' + tankVolume.toString() + ' </span>').insertAfter("#tank");
    if (parseInt(tankVolume) > 50) {
        $('.tankSensor-box').css("background", "#5abc9b");
        $('.tankSensor-box').css("color", "#000");
    } else {
        $('.tankSensor-box').css("background", "#faff00");
        $('.tankSensor-box').css("color", "#000");
    }
}


function displayBatteryVolt(voltage) {

    $(".batterySensor-box").replaceWith('<span class="batterySensor-box" id="batterySensor">' + voltage.toString() + 'V </span>');
    if (parseInt(voltage) > 5) {
        $('.batterySensor-box').css("background", "#5abc9b");
        $('.batterySensor-box').css("color", "#000");
    } else {
        $('.batterySensor-box').css("background", "#FE1C49");
        $('.batterySensor-box').css("color", "#000");
    }
}

function displayAlarmStatus(isActive) {
    console.log("isActive: " + isActive);

    if (parseInt(isActive) == 0) {
        $(".alarmStatus-box").replaceWith('<span class="alarmStatus-box" id="alarmStatus"> ARMED </span>');
        $('.alarmStatus-box').css("background", "#FE1C49");
        $('.alarmStatus-box').css("color", "#000");
        $("#activate-button").html('DEACTIVATE ALARM');
        $("#activate-button").prop("disabled", false);
        $('#activate-button').val('0');
    } else {
        $(".alarmStatus-box").replaceWith('<span class="alarmStatus-box" id="alarmStatus"> DISARMED </span>');
        $('.alarmStatus-box').css("background", "#5abc9b");
        $('.alarmStatus-box').css("color", "#000");
        $("#activate-button").html('ACTIVATE ALARM');
        $("#activate-button").prop("disabled", false);
        $('#activate-button').val('1');

    }
}

function displayParticleStatus(connectStatus) {
    if (connectStatus == 0) {

        $(".status-box").replaceWith('<span class="status-box" id="status"> Error! </span>');
        $('.status-box').css("background", "#FE1C49");
        $('.status-box').css("color", "#000");

        $('form').css("background", "#FE1C49");
        $("#connected", this).append('<b class="particleStatus" style="color:#FF0000";><br> ERROR </br></b>');

    } else if (connectStatus == 1) {

        $(".status-box").replaceWith('<span class="status-box" id="status"> Connected </span>');
        $('.status-box').css("background", "#5abc9b");
        $('.status-box').css("color", "#000");

        $('form').css("background", "#5abc9b");
        $("#connected", this).append('<mark><b class="particleStatus"><br>Connected</br></b></mark>');

    } else {

        $("#connected", this).append('<b class="particleStatus"><br> Waiting... </br></b>');
    }

}
