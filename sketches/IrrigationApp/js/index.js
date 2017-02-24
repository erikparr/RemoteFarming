/*jslint browser: true*/
/*global $, jQuery, alert*/
var deviceID = "450039000e51353433323633";
var accessToken = "0ad112ded9e5e2a67fd3c2e21ec43556deb8c3d4";

var urlLastCycleData = 'https://api.thingspeak.com/channels/218438/fields/7/last.txt';

var connectStatus = -1; // is the particel board communicating?
var runningStatus = [-1, -1]; // DigitalOut power status


$(document).ready(function () {

    updateParticleStatus(0);
    //    updateParticleStatus(1);
    updateCycleTime(0);
    //    updateCycleTime(1);
    updateAdhocTimer(0);
    //    updateAdhocTimer(1);

    $('#cycleTime1, #cycleTime2').click(function () {
        var formIndex = parseInt($(this).val());
        var index = formIndex;
        console.log("ok " + formIndex);
        var stHr = parseInt(document.forms[formIndex].elements['stHr'].value);
        var stMin = 0;
        //parseInt(document.forms[formIndex].elements['stMin'].value);
        var dur = parseInt(document.forms[formIndex].elements['dur'].value);
        var repeatDur = parseInt(document.forms[formIndex].elements['freq'].value);

        var stopMin = 0;
        //        var stopMin = (stMin + dur) % 60;
        var rollover = 0;
        if (dur + stMin >= 60 && dur < 60) {
            rollover = 1; //rollover minutes to hours
        }
        var stopHr = parseInt(stHr) + rollover + Math.floor(dur / 60);

        console.log("Orchard " + (1 + formIndex) + " cycle start:" + stHr + ":" + stMin);
        console.log("Orchard " + (1 + formIndex) + " cycle dur:" + dur);
        console.log("Orchard " + (1 + formIndex) + " cycle end:" + stopHr + ":" + stopMin);
        particleSetCycle(index + " " + stHr + " " + stMin + " " + stopHr + " " + stopMin + " " + dur + " " + repeatDur, "setAlarm");
    });


    $('#adhocTime1, #adhocTime2').click(function () {
        var formIndex = parseInt($(this).val());
        var index = formIndex;
        var dur = parseInt(document.forms[formIndex].elements['adHocDur'].value);
        console.log("adhoc dur:" + dur);
        particleSetCycle(index + " " + dur + " " + 0 + " " + 0 + " " + 0 + " " + 0, "setAdhoc");
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
    var lastStartTime;
    var lastEndTime;

    var mul = index * 5; // index multiplier moves to the correct position in the cycle data for this orchard
    // first get last cycle data from thingspeak page
    // here we are getting the last 3 days data
    $.get(urlLastCycleData, function (data) {
        console.log(data);
        var cycleStringArray = data.split(' ');
        var lastStartHr = cycleStringArray[0 + mul];
        var lastStartMin = cycleStringArray[1 + mul];
        var lastEndHr = cycleStringArray[2 + mul];
        var lastEndMin = cycleStringArray[3 + mul];
        var lastRepeatDur = cycleStringArray[4 + mul];

        if (parseInt(lastStartMin) < 10) {
            lastStartMin = "0" + lastStartMin;
        }
        if (parseInt(lastEndMin) < 10) {
            lastEndMin = "0" + lastEndMin;
        }
        lastStartTime = lastStartHr + ":" + lastStartMin;
        lastEndTime = lastEndHr + ":" + lastEndMin;
    }, 'text');

    // then get current cycle data from  particle
    requestURL = getRequestUrl("cycleTime");
    var startHr;
    var startMin;
    var endHr;
    var endMin;
    var cycleDur;
    var repeatDur;

    $.getJSON(requestURL, function (json) {
            timeString = json.result;
            var timeStringArray = timeString.split(' ');
            startHr = timeStringArray[0 + mul];
            startMin = timeStringArray[1 + mul];
            endHr = timeStringArray[2 + mul];
            endMin = timeStringArray[3 + mul];
            cycleDur = timeStringArray[4 + mul];
            repeatDur = timeStringArray[5 + mul];

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
            displayCycleTime(index, startHr, endHr, cycleDur, repeatDur, lastStartTime, lastEndTime);
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

function displayAdhocDur(formIndex, dur) {

    $(".form-container").each(function (index) {

        if (index == formIndex) {
            $('.adhoc', this).remove() //remove any previous values on screen

            //update scheduled cycle times
            $("#adhocCount", this).append('<b class="adhoc"><br>' + dur + ' </br></b>');
        }
    });
}


function displayCycleTime(formIndex, startTime, endTime, cycleDur, repeatDur, lastStartTime, lastEndTime) {

    $(".form-container").each(function (index) {

        if (index == formIndex) {
            $('.cycleTime', this).remove() //remove any previous values on screen

            //update scheduled cycle times
            $("#stHr option[value='" + startTime + "']").prop(' selected ', true);
            $("#dur option[value='" + cycleDur + "']").prop(' selected ', true);
            $("#freq option[value='" + repeatDur + "']").prop(' selected ', true);

            //    console.log("Schedule set for " + startHr + ":" + startMin + ". Will end at " + endHr + ":" + endMin);
            $("#lastStartTime", this).append(
                ' <b class="cycleTime">' + lastStartTime + ' </b>');

            $("#lastEndTime", this).append(
                '<b class="cycleTime"><br>' + lastEndTime + ' </br></b>');
        }
    });
}

function displayParticleStatus(formIndex) {
    console.log("setting display");
    $(".form-container").each(function (index) {

        if (index == formIndex) {
            $('.particleStatus', this).remove() //remove any previous values on screen
                //update status
            if (runningStatus[index] == 0) {
                $("#runState", this).append('<b class="particleStatus"><br> OFF </br></b>');
            } else if (runningStatus[index] == 1) {
                $("#runState", this).append('<mark><b class="particleStatus"><br>ON</br></b></mark>');
            } else {
                $("#runState", this).append('');
            }
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
