    /*jslint browser: true*/
    /*global $, jQuery, alert*/
    var deviceID = "3b003b000951343334363138"; // security particle
    var accessToken = "0ad112ded9e5e2a67fd3c2e21ec43556deb8c3d4";

    var urlLastCycleData1 = 'https://api.thingspeak.com/channels/248593/fields/1/last.txt';
    var urlLastCycleData2 = 'https://api.thingspeak.com/channels/248593/fields/2/last.txt';
    //'https://api.thingspeak.com/channels/218438/fields/7/last.txt';

    var battery = 1;
    var connectStatus = -1; // is the particel board communicating?
    var runningStatus = [-1, -1]; // DigitalOut power status
    var FORM_ID = -1; //different form id for each orchard / system
    var lastFlowRate = 0;
    var cycleDur;

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
            updateParticleVoltage(FORM_ID);
            updateDailyVolume(FORM_ID);
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

        $("#orchard3").click(function () {
            $("#intro").hide();
            $("#config").hide();
            $("#form1").show();
            FORM_ID = 1;
            updateParticleStatus(FORM_ID);
            updateCycleTime(FORM_ID);
            updateAdhocTimer(FORM_ID);
        });

        $("#wellkeeper").click(function () {
            //wellkeeper app is held at another address
            window.location = "http://kaubisch.org/WellKeeper/index.html";
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

        //calculate $(document) doSomething)
        //    $("#dur, #freq").pointerup(function () {
        $("#dur, #freq").on('touchend mouseup', function () {
            calculateProgramVol();
        });

        $("#adHocDur").mouseup(function () {
            calculateAdhocVol();
        });



        $('#cycleTime').click(function () {
            var index = FORM_ID;
            console.log("ok " + FORM_ID);
            var stHr = parseInt(document.forms[FORM_ID].elements['stHr'].value);
            var stMin = 0;
            //        parseInt(document.forms[FORM_ID].elements['stMin'].value);
            var dur = parseInt(document.forms[FORM_ID].elements['dur'].value);
            var repeatDur = parseInt(document.forms[FORM_ID].elements['freq'].value);

            //        var stopMin = 0;
            var stopMin = (stMin + dur) % 60;
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

        $('#uploadConfig').click(function () {
            var flowWait = parseInt($('#flowWait').val());
            var flowMul = parseFloat($('#flowMul').val());
            var ppl = parseFloat($('#ppl').val());
            var utcZone = parseInt($('#utcZone').val());
            var configString = flowWait + " " + flowMul + " " + ppl + " " + utcZone;
            particleSetConfig(configString);
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
                displayConnectionStatus();
            });

    }

    function updateParticleVoltage(index) {
        var voltageString;
        var particleVariable = "volt"; // + (index + 1);
        requestURL = "https://api.particle.io/v1/devices/" + deviceID + "/" + particleVariable + "/?access_token=" + accessToken;
        $.getJSON(requestURL, function (json) {
                voltageString = json.result;
            })
            .done(function () {
                console.log(particleVariable + " status: " + voltageString);
            })
            .fail(function () {
                console.log("Error: could not get voltage");
            })
            .always(function () {
                console.log(particleVariable + " status complete");
                displayParticleVoltage(index, voltageString);
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
        var requestString = "cycleTime" + (index + 1);
        requestURL = getRequestUrl(requestString);
        var startHr;
        var startMin;
        var endHr;
        var endMin;
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
                console.log("updateCycleTime success. Start-time: " + startTime + " End-time: " + endTime + " Cycle duration: " + cycleDur + " minutes. Repeat dur: " + repeatDur);
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
                displayCycleTime(index, startHr, endHr, repeatDur);
                displayConnectionStatus();
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
                displayConnectionStatus();
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
                connectStatus = 1;
            })
            .fail(function () {
                //displayStatus("Connection Error: Config not updated", "red");
                console.log("Connection Error: Config not updated");
                connectStatus = 0;
                //            runningStatus[index] = -1;
            })
            .always(function () {
                displayConfigSettings(configString);
                displayConnectionStatus();
            });
    }

    function updateDailyVolume(index) {
        requestURL = getRequestUrl("volString" + (index + 1));
        var volumeString;
        $.getJSON(requestURL, function (json) {
                volumeString = json.result;
            })
            .done(function () {
                console.log("Updated Daily Vol: " + volumeString);
            })
            .fail(function () {
                console.log("Connection Error: Daily Vol not updated");
            })
            .always(function () {
                displayCycleVolume(index, volumeString);
            });
    }

    function displayCycleVolume(index, volumeString) {
        var dVol;
        var yearVolTotal;
        var timeStamp;
        var cycleDur;
        var flowAnom;
        volumeString = volumeString.replace("  ", " ");
        var volumeStringArray = volumeString.split(' ');
        dVol = volumeStringArray[0];
        lastFlowRate = Math.max(0.01, volumeStringArray[1]); // 0.01 min value
        yearVolTotal = volumeStringArray[2];
        console.log("time: " + volumeStringArray[7]);
        var time = volumeStringArray[6].split(':');
        time = time[0] + ":" + time[1];
        timeStamp = volumeStringArray[3] + " " + volumeStringArray[4] + ", " + volumeStringArray[5] + " at " + time;
        cycleDur = volumeStringArray[8];
        flowAnom = volumeStringArray[9];

        $(".form-container").each(function (index) {
            $('#dailyVol', this).append(dVol);
            $('#dailyFlow', this).append(lastFlowRate);
            $('#yearVolTotal', this).append(yearVolTotal);
            $('#timeStamp', this).append(timeStamp);
            $('#cycleDur', this).append(cycleDur);
            $('#flowAnom', this).append(flowAnom);
        });
    }

    function displayConfigSettings(configString) {
        var flowmeterDelay;
        var flowrateMul;
        var ppl;
        var utcTimeZone;
        var configStringArray = configString.split(' ');
        flowmeterDelay = configStringArray[0];
        flowrateMul = configStringArray[1];
        ppl = configStringArray[2];
        utcTimeZone = configStringArray[3];

        $(".form-container").each(function (index) {

            $('#flowWait').attr('value', parseFloat(flowmeterDelay).toFixed(0));
            $('#flowMul').attr('value', parseFloat(flowrateMul).toFixed(1));
            $('#ppl').attr('value', parseFloat(ppl).toFixed(0));
            $('#utcZone').attr('value', parseFloat(utcTimeZone).toFixed(0));
        });
    }

    function displayParticleVoltage(formIndex, voltageString) {

        $(".form-container").each(function (index) {
            if (index == formIndex) {

                $("#voltage", this).replaceWith('<span class="battery-box" id="voltage">' + parseFloat(voltageString).toFixed(2) + ' V</span>');
            }
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

    function calculateProgramVol() {
        var calcVolEstimate;
        var selectedCycleDuration =
            parseFloat(document.forms[FORM_ID].elements['dur'].value);
        var selectedFreq =
            parseFloat(document.forms[FORM_ID].elements['freq'].value);
        console.log(selectedFreq);
        if (selectedFreq > 24) {
            calcVolEstimate = (lastFlowRate * selectedCycleDuration) / (selectedFreq / 24)
        } else {
            calcVolEstimate = (lastFlowRate * selectedCycleDuration) * (24 / selectedFreq)
        }
        if (isNaN(calcVolEstimate)) {
            calcVolEstimate = 0;
        }
        $(".form-container").each(function (index) {
            $("#volEstimate", this).replaceWith('<div class="align-right" id="volEstimate">' + calcVolEstimate.toFixed(2) + ' Liters/Day </div>');
        });
    }


    function calculateAdhocVol() {
        var calcVolEstimate;
        var selectedCycleDuration =
            parseFloat(document.forms[FORM_ID].elements['adHocDur'].value);
        calcVolEstimate = (lastFlowRate * selectedCycleDuration);
        if (isNaN(calcVolEstimate)) {
            calcVolEstimate = 0;
        }
        $(".form-container").each(function (index) {
            $("#adhocEstimate", this).replaceWith('<div class="align-right" id="adhocEstimate">' + calcVolEstimate.toFixed(2) + ' Liters/Day </div>');
        });
    }

    function displayCycleTime(formIndex, startTime, endTime, repeatDur) {

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

        if (index == formIndex) {
            $('#orchardID').remove();

            var orchardname = "";
            if (formIndex == 0) {
                orchardname = "Citrus";
            }
            if (formIndex == 1) {
                orchardname = "Food Forest";
            }
            if (formIndex == 2) {
                orchardname = "Almonds and Pistachio";
            }
            $("#orchardID", this).append(orchardname);

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
            //                            display battery status
            //            if (battery == 0) {
            //                $("#batteryStatus", this).remove();
            //                $("#battery", this).append('<span class="battery-box"> LOW </span>');
            //                $('.battery-box').css("background", "#FE1C49");
            //                $('.battery-box').css("color", "#000");
            //
            //            } else if (battery == 1) {
            //                //display RUN status
            //                $("#batteryStatus", this).remove();
            //                $("#battery", this).append('<span class="battery-box"> FULL </span>');
            //                $('.battery-box').css("background", "#5abc9b");
            //            }   
        }

    }

    function displayConnectionStatus() {
        console.log("displayConnectionStatus");
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
                displayConnectionStatus();
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
                displayConnectionStatus();
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
