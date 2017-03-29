/*jslint browser: true*/
/*global $, jQuery, alert*/
//var deviceID = "450039000e51353433323633"; // irrigation particle
var deviceID = "3b003b000951343334363138"; // security particle
var accessToken = "0ad112ded9e5e2a67fd3c2e21ec43556deb8c3d4";

var urlLastCycleData1 = 'https://api.thingspeak.com/channels/248593/fields/1/last.txt';
var urlLastCycleData2 = 'https://api.thingspeak.com/channels/248593/fields/2/last.txt';
//'https://api.thingspeak.com/channels/218438/fields/7/last.txt';

var battery = 1;
var connectStatus = -1; // is the particel board communicating?
var runningStatus = [-1, -1]; // DigitalOut power status
var FORM_ID = -1; //different form id for each orchard / system

$(document).ready(function () {
    //start with all the forms hidden
    $("#form1").hide();
    $("#form2").hide();
    $("#form3").hide();
    $("#config").hide();


    $("#orchard1").click(function () {
        $("#intro").hide();
        $("#config").hide();
        $("#form1").show();
        FORM_ID = 0;
        updateParticleStatus(FORM_ID);
        updateCycleTime(FORM_ID);
        updateAdhocTimer(FORM_ID);
    });
    $("#orchard2").click(function () {
        $("#intro").hide();
        $("#config").hide();
        $("#form1").show();
        FORM_ID = 1;
        updateParticleStatus(FORM_ID);
        updateCycleTime(FORM_ID);
        updateAdhocTimer(FORM_ID);
    });

    //    $("#orchard3").click(function () {
    //        $("#intro").hide();
    //        $("#form1").show();
    //        FORM_ID = 1;
    //        updateParticleStatus(FORM_ID);
    //        updateCycleTime(FORM_ID);
    //        updateAdhocTimer(FORM_ID);
    //    });

    $("#configBt").click(function () {
        $("#intro").hide();
        $("#config").show();
        $("#form1").hide();
        FORM_ID = 3;
        updateConfig();
    });



    $('#cycleTime').click(function () {
        var index = FORM_ID;
        console.log("ok " + FORM_ID);
        var stHr = parseInt(document.forms[FORM_ID].elements['stHr'].value);
        var stMin = 0;
        //parseInt(document.forms[FORM_ID].elements['stMin'].value);
        var dur = parseInt(document.forms[FORM_ID].elements['dur'].value);
        var repeatDur = parseInt(document.forms[FORM_ID].elements['freq'].value);

        var stopMin = 0;
        //        var stopMin = (stMin + dur) % 60;
        var rollover = 0;
        if (dur + stMin >= 60 && dur < 60) {
            rollover = 1; //rollover minutes to hours
        }
        var stopHr = parseInt(stHr) + rollover + Math.floor(dur / 60);

        console.log("Orchard " + (1 + FORM_ID) + " cycle start:" + stHr + ":" + stMin);
        console.log("Orchard " + (1 + FORM_ID) + " cycle dur:" + dur);
        console.log("Orchard " + (1 + FORM_ID) + " cycle end:" + stopHr + ":" + stopMin);
        particleSetCycle(index + " " + stHr + " " + stMin + " " + stopHr + " " + stopMin + " " + dur + " " + repeatDur, "setAlarm");
    });


    $('#adhocTime').click(function () {
        var index = FORM_ID;
        var dur = parseInt(document.forms[FORM_ID].elements['adHocDur'].value);
        console.log("adhoc dur:" + dur);
        particleSetCycle(index + " " + dur + " " + 0 + " " + 0 + " " + 0 + " " + 0, "setAdhoc");
    });

    $('#manualOff').click(function () {
        var index = FORM_ID;
        particleSetCycle(index + " " + 0 + " " + 0 + " " + 0 + " " + 0 + " " + 0, "manualStop");
    });



});


function updateParticleStatus(index) {
    var result;
    var particleVariable = "runState" + (index + 1);
    requestURL = "https://api.particle.io/v1/devices/" + deviceID + "/" + particleVariable + "/?access_token=" + accessToken;
    $.getJSON(requestURL, function (json) {
            result = json.result;
        })
        .done(function () {
            console.log(particleVariable + " status: " + result);
            connectStatus = 1;
        })
        .fail(function () {
            console.log("error");
            connectStatus = 0;
        })
        .always(function () {
            runningStatus[index] = result;
            console.log(particleVariable + " status complete");
            displayParticleStatus(index);
        });

}

//update "last" cycle time from thingspeak cloud and current cycle time from particle board
//index indicates which "orchard" we are updating
function updateCycleTime(index) {
    var timeString;

    var startTime;
    var endTime;

    //NOTE! This is commented out. Here you can get the most recently logged cycle data from thingspeak
    //Instead we are getting the data straight from the particle, it should be the same
    //data unless the particle restarted, losing its current settings. this could be
    //used as a backup method for getting data if the particle restarts. mark under TO-DO
    //    var lastStartTime;
    //    var lastEndTime;
    //    var urlCycleDataLog;
    //    if (index == 0) {
    //        urlCycleDataLog = urlLastCycleData1;
    //    } else {
    //        urlCycleDataLog = urlLastCycleData2;
    //    }
    //    // first get last cycle data from thingspeak page
    //    $.get(urlCycleDataLog, function (data) {
    //        console.log(data);
    //        var cycleStringArray = data.split(' ');
    //        var lastStartHr = cycleStringArray[0];
    //        var lastStartMin = cycleStringArray[1];
    //        var lastEndHr = cycleStringArray[2];
    //        var lastEndMin = cycleStringArray[3];
    //        var lastRepeatDur = cycleStringArray[4];
    //
    //        if (parseInt(lastStartMin) < 10) {
    //            lastStartMin = "0" + lastStartMin;
    //        }
    //        if (parseInt(lastEndMin) < 10) {
    //            lastEndMin = "0" + lastEndMin;
    //        }
    //        lastStartTime = lastStartHr + ":" + lastStartMin;
    //        lastEndTime = lastEndHr + ":" + lastEndMin;
    //        console.log("last start time: "+ lastStartTime);
    //        console.log("last end time: "+lastEndTime);
    //    }, 'text');

    // then get current cycle data from  particle
    if (index == 0) {
        requestURL = getRequestUrl("cycleTime1");
    } else if (index == 1) {
        requestURL = getRequestUrl("cycleTime2");
    }
    var startHr;
    var startMin;
    var endHr;
    var endMin;
    var cycleDur;
    var repeatDur;

    $.getJSON(requestURL, function (json) {
            timeString = json.result;
            var timeStringArray = timeString.split(' ');
            startHr = timeStringArray[0];
            startMin = timeStringArray[1];
            endHr = timeStringArray[2];
            endMin = timeStringArray[3];
            cycleDur = timeStringArray[4];
            repeatDur = timeStringArray[5];

            //add padding to make it readable
            if (parseInt(startMin) < 10) {
                startMin = "0" + startMin;
            }
            if (parseInt(endMin) < 10) {
                endMin = "0" + endMin;
            }

            startTime = startHr + ":" + startMin;
            endTime = endHr + ":" + endMin;
        })
        .done(function () {
            console.log("updateCycleTime success");
            connectStatus = 1;
        })
        .fail(function () {
            console.log("updateCycleTime error");
            connectStatus = 0;
            runningStatus[index] = -1;
        })
        .always(function () {
            console.log("updateCycleTime complete");
            //displayCicleTime takes an index arg to specify which html form to update
            displayCycleTime(index, startHr, endHr, cycleDur, repeatDur);
            //            displayCycleTime(index, startHr, endHr, cycleDur, repeatDur, lastStartTime, lastEndTime);

        });

}

function updateAdhocTimer(index) {
    // then get adhoc time from  particle
    requestURL = getRequestUrl("ahocTimer" + (index + 1));
    var adhocDur;
    $.getJSON(requestURL, function (json) {
            adhocDur = parseInt(json.result);
        })
        .done(function () {
            console.log("Get-Particle-Time success");
            connectStatus = 1;
        })
        .fail(function () {
            console.log("error");
            connectStatus = 0;
            runningStatus[index] = -1;
        })
        .always(function () {
            console.log("complete");
            console.log("ahocTimer" + (index + 1) + ": " + adhocDur);
            //displayCicleTime takes an index arg to specify which html form to update
            displayAdhocDur(index, adhocDur);
        });

}

function updateConfig() {
    requestURL = getRequestUrl("configString");
    var configString;
    $.getJSON(requestURL, function (json) {
            configString = json.result;
            //            configString = flowmeterDelay + " " + pulseRate + " " + flowrateMul + " " + ppl + " " + utcTimeZone;
        })
        .done(function () {
            //displayStatus("Config updated", "green");
            console.log("Config updated");
            //            connectStatus = 1;
        })
        .fail(function () {
            //displayStatus("Connection Error: Config not updated", "red");
            console.log("Connection Error: Config not updated");
            //            connectStatus = 0;
            //            runningStatus[index] = -1;
        })
        .always(function () {
            displayConfigSettings(configString);
        });


}

function displayConfigSettings(configString) {
    var flowmeterDelay;
    var pulseRate;
    var flowrateMul;
    var ppl;
    var utcTimeZone;
    var configStringArray = configString.split(' ');
    flowmeterDelay = configStringArray[0];
    pulseRate = configStringArray[1];
    flowrateMul = configStringArray[2];
    ppl = configStringArray[3];
    utcTimeZone = configStringArray[4];

    $(".form-container").each(function (index) {

        $('#flowWait').attr('value', flowmeterDelay)
        $('#flowPulse').attr('value', pulseRate)
        $('#flowMul').attr('value', flowrateMul)
        $('#ppl').attr('value', ppl)
        $('#utcZone').attr('value', utcTimeZone)
    });
}


function displayAdhocDur(formIndex, dur) {

    $(".form-container").each(function (index) {

        if (index == formIndex) {
            $('.adhoc', this).remove() //remove any previous values on screen

            //update scheduled cycle times
            $("#adhocCount", this).append('<b class="adhoc"><br>' + dur + ' </br></b>');
        }
    });
}



function displayCycleTime(formIndex, startTime, endTime, cycleDur, repeatDur) {

    $(".form-container").each(function (index) {
        if (index == formIndex) {
            $('.cycleTime', this).remove() //remove any previous values on screen
                //update scheduled cycle times
            $("#stHr option[value='" + startTime + "']").prop("selected", true);
            $("#dur option[value='" + cycleDur + "']").prop("selected", true);
            $("#freq option[value='" + repeatDur + "']").prop("selected", true);

            //    console.log("Schedule set for " + startHr + ":" + startMin + ". Will end at " + endHr + ":" + endMin);
            //            $("#lastStartTime", this).append(
            //                ' <b class="cycleTime">' + lastStartTime + ' </b>');
            //
            //            $("#lastEndTime", this).append(
            //                '<b class="cycleTime"><br>' + lastEndTime + ' </br></b>');
        }
    });
}

function displayParticleStatus(formIndex) {
    console.log("setting display");
    $(".form-container").each(function (index) {

        if (index == formIndex) {
            $('.particleStatus', this).remove() //remove any previous values on screen
            $('#orchardID', this).remove();
            $("#orchardID", this).append('Orchard ' + (FORM_ID + 1));

            //display status
            if (runningStatus[index] == 0) {
                $("#runStatus", this).remove();
                $("#runState", this).append('<span class="run-box"> OFF </span>');
                $('.run-box').css("background", "#000");
                $('.run-box').css("color", "#FFF");

            } else if (runningStatus[index] == 1) {
                //display RUN status
                $("#runStatus", this).remove();
                $("#runState", this).append('<span class="run-box"> ON </span>');
                $('.run-box').css("background", "#5abc9b");
            }
            //            display battery status
            if (battery == 0) {
                $("#batteryStatus", this).remove();
                $("#battery", this).append('<span class="battery-box"> LOW </span>');
                $('.battery-box').css("background", "#FE1C49");
                $('.battery-box').css("color", "#000");

            } else if (battery == 1) {
                //display RUN status
                $("#batteryStatus", this).remove();
                $("#battery", this).append('<span class="battery-box"> FULL </span>');
                $('.battery-box').css("background", "#5abc9b");
            }
            //display device name
            $("#devName", this).append('<b class="particleStatus"><br> Particle 1 </br></b>');

            if (connectStatus == 0) {
                $('form').css("background", "#FE1C49");
                $("#connected", this).append('<b class="particleStatus" style="color:#FF0000";><br> ERROR </br></b>');

            } else if (connectStatus == 1) {
                $('form').css("background", "#5abc9b");
                $("#connected", this).append('<mark><b class="particleStatus"><br>Connected</br></b></mark>');

            } else {
                $("#connected", this).append('<b class="particleStatus"><br> Waiting... </br></b>');
            }
        }
    });
}



function getRequestUrl(particleVar) {
    var reqURL = "https://api.particle.io/v1/devices/" + deviceID + "/" + particleVar + "/?access_token=" + accessToken;
    return reqURL;
}


function particleSetCycle(cycleString, funcName) {
    console.log("out to particle: " + cycleString);
    var cycleStringArray = cycleString.split(' ');
    var index = parseInt(cycleStringArray[0]);
    var setFunc = funcName;
    var requestURL = "https://api.particle.io/v1/devices/" + deviceID + "/" + setFunc + "/";
    $.post(requestURL, {
            params: cycleString,
            access_token: accessToken
        })
        .done(function () {
            console.log("Get-Particle-Time success");
        })
        .fail(function () {
            console.log("error");
            connectStatus = 0;
            runningStatus[index] = -1;
        })
        .always(function () {
            console.log("complete");
            if (funcName == "setAlarm") {
                updateCycleTime(index);
            } else if (funcName == "setAdhoc") {
                updateAdhocTimer(index);
            }
        });

}

function particleSetConfig(configString) {
    console.log("setting config to particle: " + configString);
    var configStringArray = configString.split(' ');
    var setFunc = "setConfig";
    var requestURL = "https://api.particle.io/v1/devices/" + deviceID + "/" + setFunc + "/";
    $.post(requestURL, {
            params: configString,
            access_token: accessToken
        })
        .done(function () {
            console.log("Config sent");
        })
        .fail(function () {
            console.log("error");
            connectStatus = 0;
            runningStatus[index] = -1;
        })
        .always(function () {
            console.log("complete");
            updateConfig();
        });

}

//function initListeners() {
//    document.getElementById("b1").addEventListener("click", function () {
//        showhide("form1", document.getElementById("b1").checked);
//    }, false);
//}

//function showhide(elementName, isVisible) {
//// Get a reference to your form's id
//var form = document.getElementById(elementName);
//// If it is visible, hide it, otherwise show it.
//if (isVisible == true) {
//    form.style.visibility = "hidden";
//} else {
//    form.style.visibility = "visible";
//}
//}
