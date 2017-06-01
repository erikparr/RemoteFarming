//******* FIX THIS -- litersPerMinute should be passed as arg~!!!! ********
//******* FIX THIS -- litersPerMinute should be passed as arg~!!!! ********
//******* FIX THIS -- litersPerMinute should be passed as arg~!!!! ********

#include <SparkIntervalTimer.h>
#include <TimeAlarms.h>


// for time sync and time management
#define ONE_DAY_MILLIS (24 * 60 * 60 * 1000)
#define ONE_HOUR_MILLIS (60 * 60 * 1000)
unsigned long dailyTimer = millis();
unsigned long hourlyTimer = millis();
bool bPublishData = false;


// int photoresistor = A0; // This is where your photoresistor is plugged in. The other side goes to the "power" pin (below).
// int power = A5; // This is the other end of your photoresistor. The other side is plugged into the "photoresistor" pin (above).
int analogvalue = 0;

//set these values from thingspeak
int todayVol = 0;
int lastDayVol = 0;
int secondDayVol = 0;
int thirdDayVol = 0;

int flowsensorPin1 = D3;
int flowsensorPin2 = D2;
int flowsensorPin3 = D4;
int waterValve1 = D7;
int waterValve2 = D6;
int waterValve3 = D5;
int powerState1 = LOW;
int powerState2 = LOW;
int powerState3 = LOW;
int t1StartHour = 21;
int t1StartMin = 40;
int t1EndHour = 22;
int t1EndMin = 0;
int t3EndHour = 22;
int t3EndMin = 0;
int t2StartHour = 21;
int t2StartMin = 40;
int t2EndHour = 22;
int t2EndMin = 0;
int t3EndHour = 22;
int t3EndMin = 0;
int cycleDur1 =0;
int cycleDur2 =0;
int cycleDur3 =0;
int repeatDur1 =0;
int repeatDur2 =0;
int repeatDur3 =0;


unsigned long adhocDur1 = 0;
unsigned long adhocDur2 = 0;
unsigned long adhocDur3 = 0;
unsigned long adhocTstamp1 = 0;
unsigned long adhocTstamp2 = 0;
unsigned long adhocTstamp3 = 0;
int adhocTimer1 = 0;
int adhocTimer2 = 0;
int adhocTimer3 = 0;
bool bAdhocOn1 = false;
bool bAdhocOn2 = false;
bool bAdhocOn3 = false;
bool manualOff1 = false;
bool manualOff2 = false;
bool manualOff3 = false;

String cycleTimeString1 = "";
String cycleTimeString2 = "";
String cycleTimeString3 = "";
String configString = "";

//volume variables
int dvol1 = 0;
int dvol2 = 0;
int dvol3 = 0;
int dFlowRt1 = 0;
int dFlowRt2 = 0;
int dFlowRt3 = 0;
int dFlowAnm1 = 0;
int dFlowAnm2 = 0;
int dFlowAnm3 = 0;
int dTemp1 = 0;
int dTemp2 = 0;
int dTemp3 = 0;
int dHum1 = 0;
int dHum2 = 0;
int dHum3 = 0;

//config menu variables
int flowmeterDelay =  1;// in minutes
float pulseRate = 1.8;
float flowrateMul = 1;
double ppl = 550;//pulses per liter
float utcTimeZone = 2.0;
float flowThreshPct = 0.25;

//Voltage sensor vars
float voltageInput = A1;
float vout = 0.0;
float vin = 0.0;
float R1 = 30000.0; //
float R2 = 7500.0; //
float voltValue = 0.0;
float volt=0.0;
String voltString="";

AlarmID_t onAlarmT1;
AlarmID_t offAlarmT1;
AlarmID_t onAlarmT2;
AlarmID_t offAlarmT2;

//Flow sensor setup
IntervalTimer msTimer;
volatile uint32_t usLastTime  = 0;
volatile uint32_t usDeltaTime = 0;
volatile uint32_t msCount     = 0;
volatile double   revPerSec   = 0;
volatile double   revPerMS    = 0;
float flowRate1 = 0;
float previousFlowRate1 = 0;
float litersPerMinute1;
float litersPerMinute2;
float litersPerMinute3;
unsigned long pulseTotalPerCycle = 0;

int cycleDuration1=0;
int cycleDuration2=0;
int cycleDuration3=0;
int yearVolTotal1=0;
int yearVolTotal2=0;
int yearVolTotal3=0;
String volString1 = "";
String volString2 = "";
String volString3 = "";

void setup() {
    //  onAlarmT1 = Alarm.alarmOnce(13,35,0, powerOn1);
    //  offAlarmT1 = Alarm.alarmOnce(t1EndHour,t1EndMin,0, powerOff1);
    //  onAlarmT2 = Alarm.alarmOnce(t2StartHour,t2StartMin,0, powerOn2);
    //  offAlarmT2 = Alarm.alarmOnce(t2EndHour,t2EndMin,0, powerOff2);litersPerMinute


    //flow sensor setup
    msTimer.begin(msISR, 1000, uSec);  // trigger every 1000µs
    pinMode(flowsensorPin1, INPUT_PULLUP);
    attachInterrupt(flowsensorPin1, senseISR, FALLING);


    dailySync(); //sync time
    // Serial.begin(9600);
    // pinMode(photoresistor, INPUT);
    // pinMode(power, OUTPUT); // The pin powering the photoresistor is output (sending out consistent power)
    // digitalWrite(power, HIGH);

    Alarm.alarmRepeat(3, 00, 0, dailyTasks); //  at 3AM every day

    pinMode(voltageInput, INPUT); // voltage input A1

    pinMode(waterValve1, OUTPUT);
    pinMode(waterValve2, OUTPUT);
    pinMode(waterValve3, OUTPUT);
    /*Particle.function("led",powerToggle);*/
    Particle.function("setAlarm", resetAlarmTime); // set alarms for watering cycles
    Particle.function("setAdhoc", setAdhocTime); // set ad hoc watering control
    Particle.function("manualStop", setManualStop); // set ad hoc watering control
    Particle.function("setConfig", setConfig); // set config settings from web menu


    //   Particle.function("getcycleTimeString", cycleTimeString);
    Particle.variable("runState1", &powerState1, INT);
    Particle.variable("runState2", &powerState2, INT);
    Particle.variable("runState3", &powerState2, INT);
    Particle.variable("cycleTime1", &cycleTimeString1, STRING);
    Particle.variable("cycleTime2", &cycleTimeString2, STRING);
    Particle.variable("cycleTime3", &cycleTimeString2, STRING);
    Particle.variable("configString", &configString, STRING);
    Particle.variable("ahocTimer1", &adhocTimer1, INT);
    Particle.variable("ahocTimer2", &adhocTimer2, INT);
    Particle.variable("ahocTimer3", &adhocTimer2, INT);
    Particle.variable("volt", &voltString, STRING);
    Particle.variable("volString1", &volString1, STRING);
    Particle.variable("volString2", &volString1, STRING);
    Particle.variable("volString3", &volString1, STRING);

    // Particle.variable("litersPM", litersPerMinute);

    cycleTimeString1 = String(t1StartHour) + " " + String(t1StartMin) + " " + String(t1EndHour) + " " + String(t1EndMin) + " " + String(cycleDur1) +" "+ String(repeatDur1);
    cycleTimeString2 = String(t2StartHour) + " " + String(t2StartMin) + " " + String(t2EndHour) + " " + String(t2EndMin)+ " " + String(cycleDur2) + " "+ String(repeatDur2);
    cycleTimeString3 = String(t3StartHour) + " " + String(t3StartMin) + " " + String(t3EndHour) + " " + String(t3EndMin)+ " " + String(cycleDur3) + " "+ String(repeatDur3);

    configString = String(flowmeterDelay)  + " " + String(flowrateMul) + " " + String(ppl)+ " " + String(utcTimeZone) + " " + String(flowThreshPct);

    volString1 = String(dvol1)+ " " + String(dFlowRt1) + " " + String(yearVolTotal1) + " " + Time.timeStr() + " " + String(cycleDuration1) + " " + String(dFlowAnm1);
    volString2 = String(dvol1)+ " " + String(dFlowRt1) + " " + String(yearVolTotal2) + " " + Time.timeStr() + " " + String(cycleDuration2) + " " + String(dFlowAnm2);
    volString3 = String(dvol1)+ " " + String(dFlowRt1) + " " + String(yearVolTotal3) + " " + Time.timeStr() + " " + String(cycleDuration3) + " " + String(dFlowAnm3);

    //p1data_request
    //    Particle.subscribe("hook-response/getLast", getLastHandler, MY_DEVICES);


    digitalWrite(waterValve1, LOW); //init LOW to make sure its OFF
    digitalWrite(waterValve2, LOW); //init LOW to make sure its OFF
    digitalWrite(waterValve3, LOW); //init LOW to make sure its OFF

    //*** SCHEDULING ***
    //Berlin time zone
    Time.zone(utcTimeZone); // Berlin = UTC+2
}



void loop() {

    // flowRate = (revPerSec * 1.8);        //Take counted pulses in the last second and multiply by 2.25mL
    // flowRate = flowRate * 60;         //Convert seconds to minutes, giving you mL / Minute
    // litersPerMinute = flowRate / 1000;       //Convert mL to Liters, giving you Liters / Minute
    /*Serial.println(litersPerMinute);*/

    // read the value at analog input
    voltValue = analogRead(voltageInput);
    vout = (voltValue * 5.0) / 1024.0; // see text
    vin = vout / (R2/(R1+R2));
    volt = vin/6; //LETS TRY SCALING IT BY 6 TO GET IT IN RANGE //map(vin, 0, vInMax, 0, 100); //remap the values
    voltString = String(volt);
    Serial.println(volt);
    manageTime();
    // analogvalue = analogRead(photoresistor);


    //bPublishData returns true once an hour
    if (bPublishData == true) {
        publishHourly();
    }
    delay(1000); // update only once a second
    // !Must have this for alarm to update!
    Alarm.delay(1000);


}

int setAdhocTime(String timeString) {

    //convert timeString we got from the cloud into an array of usable values
    //Begin black magic supplied by @mdma at:
    // https://community.spark.io/t/gpio-control-via-gui/6310/7
    char charBuf[20];
    timeString.toCharArray(charBuf, 20);
    const int value_count = 8; // the maximum number of values
    int values[value_count]; // store the values here

    char string[20];
    strcpy(string, charBuf); // the string to split
    int idx = 0;
    for (char * pt = strtok(string, " "); pt && idx < value_count; pt = strtok(NULL, " ")) {
        values[idx++] = atoi(pt);
    }
    //End black magic.

    //assign values
    // first we get the index of which orchard is getting set
    int index = values[0];
    // set the correct vars according to the index
    if (index == 0) {
        powerOn1();
        adhocDur1 = values[1] * 60 * 1000; //get in MILLIS
        cycleDuration1 = adhocDur1;
        adhocTstamp1 = millis();
        bAdhocOn1 = true;

    } else if (index == 1) {
        powerOn2();
        adhocDur2 = values[1] * 60 * 1000; //get in MILLIS
        cycleDuration2 = adhocDur2;
        adhocTstamp2 = millis();
        bAdhocOn2 = true;
    } else if (index == 2) {
        powerOn3();
        adhocDur3 = values[1] * 60 * 1000; //get in MILLIS
        cycleDuration3 = adhocDur3;
        adhocTstamp3 = millis();
        bAdhocOn3 = true;
    }

    return 1;
}

int setManualStop(String indexString){
    //convert timeString we got from the cloud into an array of usable values
    //Begin black magic supplied by @mdma at:
    // https://community.spark.io/t/gpio-control-via-gui/6310/7
    char charBuf[20];
    indexString.toCharArray(charBuf, 20);
    const int value_count = 8; // the maximum number of values
    int values[value_count]; // store the values here

    char string[20];
    strcpy(string, charBuf); // the string to split
    int idx = 0;
    for (char * pt = strtok(string, " "); pt && idx < value_count; pt = strtok(NULL, " ")) {
        values[idx++] = atoi(pt);
    }
    //End black magic.


    int index = values[0];

    if(index==0){
        manualOff1 = true;
        powerOff1();
        manualOff1 = false;
    }else if(index==1){
        manualOff2 = true;
        powerOff2();
        manualOff2 = false;
    }else if(index==2){
        manualOff3 = true;
        powerOff3();
        manualOff3 = false;
    }
    return 1;
}


int setConfig(String configInputString){
    //convertlastLitersPerMinute timeString we got from the cloud into an array of usable values
    //Begin black magic supplied by @mdma at:
    // https://community.spark.io/t/gpio-control-via-gui/6310/7
    char charBuf[20];
    configInputString.toCharArray(charBuf, 20);
    const int value_count = 8; // the maximum number of values
    int values[value_count]; // store the values here

    char string[20];
    strcpy(string, charBuf); // the string to split
    int idx = 0;
    for (char * pt = strtok(string, " "); pt && idx < value_count; pt = strtok(NULL, " ")) {
        values[idx++] = atoi(pt);
    }
    //End black magic.

    flowmeterDelay =  values[0];
    flowrateMul = values[1];
    ppl = values[2];
    utcTimeZone = values[3];
    flowThreshPct = values[4];
    configString = String(flowmeterDelay)  + " " + String(flowrateMul) + " " + String(ppl)+ " " + String(utcTimeZone) + " " + String(flowThreshPct);

    return 1;
}



int resetAlarmTime(String timeString) {

    //convert timeString we got from the cloud into an array of usable values
    //Begin black magic supplied by @mdma at:
    // https://community.spark.io/t/gpio-control-via-gui/6310/7
    char charBuf[20];
    timeString.toCharArray(charBuf, 20);
    const int value_count = 8; // the maximum number of values
    int values[value_count]; // store the values here

    char string[20];
    strcpy(string, charBuf); // the string to split
    int idx = 0;
    for (char * pt = strtok(string, " "); pt && idx < value_count; pt = strtok(NULL, " ")) {
        values[idx++] = atoi(pt);
    }
    //End black magic.

    //assign values
    // first we get the index of w`hich orchard is getting set
    int index = values[0];


    // set the correct vars according to the index
    if (index == 0) {

        Alarm.free(onAlarmT1);//free previous alarms
        Alarm.free(offAlarmT1);
        t1StartHour = values[1];
        t1StartMin = values[2];
        t1EndHour = values[3];
        t1EndMin = values[4];
        cycleDur1 = values[5];
        repeatDur1 = values[6];
        cycleDuration1 = cycleDur1;
        //set specific irrigation alarm according to systemID
        onAlarmT1 = Alarm.alarmOnce(t1StartHour, t1StartMin, 0, powerOn1);
        cycleTimeString1 = String(t1StartHour) + " " + String(t1StartMin) + " " + String(t1EndHour) + " " + String(t1EndMin) + " " + String(cycleDur1) +" "+ String(repeatDur1);

    } else if (index == 1) {

        Alarm.free(onAlarmT2);//free previous alarms
        Alarm.free(offAlarmT2);
        t2StartHour = values[1];
        t2StartMin = values[2];
        t2EndHour = values[3];
        t2EndMin = values[4];
        cycleDur2 = values[5];
        repeatDur2 = values[6];
        cycleDuration2 = cycleDur2;
        //set specific irrigation alarm according to systemID
        onAlarmT2 = Alarm.alarmOnce(t2StartHour, t2StartMin, 0, powerOn2);
        cycleTimeString2 = String(t2StartHour) + " " + String(t2StartMin) + " " + String(t2EndHour) + " " + String(t2EndMin)+ " " + String(cycleDur2) + " "+ String(repeatDur2);
    }else if (index == 2) {

        Alarm.free(onAlarmT3);//free previous alarms
        Alarm.free(offAlarmT3);
        t3StartHour = values[1];
        t3StartMin = values[2];
        t3EndHour = values[3];
        t3EndMin = values[4];
        cycleDur3 = values[5];
        repeatDur3 = values[6];
        cycleDuration3 = cycleDur3;
        //set specific irrigation alarm according to systemID
        onAlarmT3 = Alarm.alarmOnce(t3StartHour, t3StartMin, 0, powerOn3);
        cycleTimeString3 = String(t3StartHour) + " " + String(t3StartMin) + " " + String(t3EndHour) + " " + String(t3EndMin)+ " " + String(cycleDur3) + " "+ String(repeatDur3);
    }
    return 1;
}



void manageTime() {
    //set publish boolean once an hour NOTE: NOT CURRENTLY DOING ANYTHING
    if (millis() - hourlyTimer > ONE_HOUR_MILLIS) {
        bPublishData = true;
        hourlyTimer = millis();
    }
    //sync time once a day
    if (millis() - dailyTimer > ONE_DAY_MILLIS) {
        dailySync();
    }
    // when time is up turn adhoc off
    if (millis() - adhocTstamp1 > adhocDur1 && bAdhocOn1 == true) {
        powerOff1();
        bAdhocOn1=false;
    }
    // when time is up turn adhoc off
    if (millis() - adhocTstamp2 > adhocDur2 && bAdhocOn2 == true) {
        powerOff2();
        bAdhocOn2=false;
    }
    if (millis() - adhocTstamp3 > adhocDur3 && bAdhocOn3 == true) {
        powerOff3();
        bAdhocOn3=false;
    }
    //keep track of time remaining on adhoc for web display. convert to minutes: 60000 millis
    adhocTimer1 = max(0, ((int)(adhocDur1 / 60000)) - ((int)(millis() - adhocTstamp1) / 60000));
    adhocTimer2 = max(0, ((int)(adhocDur2 / 60000)) - ((int)(millis() - adhocTstamp2) / 60000));
    adhocTimer3 = max(0, ((int)(adhocDur3 / 60000)) - ((int)(millis() - adhocTstamp3) / 60000));

}



void publishDaily() {

    Particle.publish("dTemp", String(random(10) + 20), PRIVATE); //Temp
    Particle.publish("dHum", String(random(100)), PRIVATE); //Hum


    Particle.publish("dVol1", String(dvol1) + " " + String(dvol2), PRIVATE); //Volume / Cycle
    Particle.publish("dFlowRt1", String(dFlowRt1) + " " + String(dFlowRt2), PRIVATE); //Flow Rate
    Particle.publish("dFlowAnm1", String(dFlowAnm1) + " " + String(dFlowAnm2), PRIVATE); //Flow Anomaly
    Particle.publish("volData1", String(todayVol), PRIVATE); //volume data for today
    //  Particle.publish("volData1", String(todayVol) + " " + String(lastDayVol) + " " + String(secondDayVol) + " " + String(thirdDayVol), PRIVATE); //all the volume data

    Particle.publish("dVol2", String(dvol2) + " " + String(dvol2), PRIVATE); //Volume / Cycle
    Particle.publish("dFlowRt2", String(dFlowRt2) + " " + String(dFlowRt2), PRIVATE); //Flow Rate
    Particle.publish("dFlowAnm2", String(dFlowAnm2) + " " + String(dFlowAnm2), PRIVATE); //Flow Anomaly
    Particle.publish("volData2", String(todayVol) + " " + String(lastDayVol) + " " + String(secondDayVol) + " " + String(thirdDayVol), PRIVATE); //all the volume data

    Particle.publish("dVol3", String(dvol1) + " " + String(dvol2), PRIVATE); //Volume / Cycle
    Particle.publish("dFlowRt3", String(dFlowRt1) + " " + String(dFlowRt2), PRIVATE); //Flow Rate
    Particle.publish("dFlowAnm3", String(dFlowAnm1) + " " + String(dFlowAnm2), PRIVATE); //Flow Anomaly
    Particle.publish("volData3", String(todayVol) + " " + String(lastDayVol) + " " + String(secondDayVol) + " " + String(thirdDayVol), PRIVATE); //all the volume data

    bPublishData = false;

    /*Particle.publish("lastCycle",String(t1StartHour)+" "+String(t1StartMin)+" "+String(t1EndHour)+" "+String(t1EndMin),PRIVATE); //Volume*/
}



void publishLastCycle1() {
    String publishString = String(t1StartHour) + ":" + String(t1StartMin) + " "+ String(cycleDuration1) + String(litersPerMinute1) + " " + String(dFlowAnm1) + " "+ String(volt) +" - " +(Time.timeStr());
    Particle.publish("lastCycle1", publishString, PRIVATE); //publish last water cycle for orchard 1
}

void publishLastCycle2() {
    String publishString = String(t2StartHour) + ":" + String(t2StartMin) + " "+ String(cycleDur2) + String(litersPerMinute2) + " " + String(dFlowAnm2) + " "+ String(volt) +" - " +(Time.timeStr());
    Particle.publish("lastCycle2", publishString, PRIVATE); //publish last water cycle for orchard 2
}

void publishLastCycle3() {
    String publishString = String(t2StartHour) + ":" + String(t2StartMin) + " "+ String(cycleDur2) + String(litersPerMinute2) + " " + String(dFlowAnm2) + " "+ String(volt) +" - " +(Time.timeStr());
    Particle.publish("lastCycle2", publishString, PRIVATE); //publish last water cycle for orchard 2
}


void calculateCycleVol() {
    // calculate volume here
    dvol1 = pulseTotalPerCycle / ppl; // dailyDuration1 is calcd in minutes
    volString1 = String(dvol1)+ " " + String(dFlowRt1) + " " + String(yearVolTotal) + " " + Time.timeStr() + " " + String(cycleDuration1) + " " + String(dFlowAnm1);
    dvol2 = pulseTotalPerCycle / ppl; // dailyDuration1 is calcd in minutes
    volString3 = String(dvol2)+ " " + String(dFlowRt2) + " " + String(yearVolTotal) + " " + Time.timeStr() + " " + String(cycleDuration1) + " " + String(dFlowAnm1);
    dvol3 = pulseTotalPerCycle / ppl; // dailyDuration1 is calcd in minutes
    volString3 = String(dvol3)+ " " + String(dFlowRt3) + " " + String(yearVolTotal) + " " + Time.timeStr() + " " + String(cycleDuration1) + " " + String(dFlowAnm1);
    // dvol2 = litersPerMinute * dailyDuration1; // dailyDuration1 is calcd in minutes
    pulseTotalPerCycle = 0; //reset counter
    previousFlowRate = flowRate;
}

float calculateFlowAnomaly(){
    //probably a more elagant way of doing this...
    if(flowRate>previousFlowRate){ // calc flow anomaly
        dFlowAnm1 = previousFlowRate/flowRate; // percentage change
        dFlowAnm1 = dFlowAnm1*100; //convert to percentage values
    }else{
        dFlowAnm1 = (flowRate/previousFlowRate) * -1; //negative percentage change
        dFlowAnm1 = dFlowAnm1*100; //convert to percentage values
    }
    return flowAnom;
}

//do once a day
void dailyTasks() {
    dailySync();
    calculateCycleVol();
    publishDaily();
    //update Volume data vars
    thirdDayVol = secondDayVol;
    secondDayVol = lastDayVol;
    lastDayVol = todayVol;
}

void dailySync() {

    // Request time synchronization from the Particle Cloud
    Particle.syncTime();
    dailyTimer = millis();

}

void powerOn1() {
    Serial.println("turn on! End time: "+String(t1EndHour)+":"+String(t1EndMin));

    powerState1 = HIGH;
    digitalWrite(waterValve1, powerState1);
    offAlarmT1 = Alarm.alarmOnce(t1EndHour, t1EndMin, 0, powerOff1);
    //add the duration to our daily run-duration counter IN MINUTES
}

void powerOn2() {
    powerState2 = HIGH;
    digitalWrite(waterValve2, powerState2);
    offAlarmT2 = Alarm.alarmOnce(t2EndHour, t2EndMin, 0, powerOff2);
    //add the duration to our daily run-duration counter
}

void powerOff1() {
    powerState1 = LOW; //turn it off
    digitalWrite(waterValve1, powerState1);
    // publish this last cycle to cloud, unless manuall shut off

    if(manualOff1==false){
        publishLastCycle1();
    }

    //if repeat frequency is set reset the alarm automatically, in increments of repeatDur
    if(repeatDur1>0 && manualOff1==false){
        t1StartHour = (t1StartHour+repeatDur1)%24;
        t1EndHour = (t1EndHour+repeatDur1)%24;
        onAlarmT1 = Alarm.alarmOnce(t1StartHour, t1StartMin, 0, powerOn1);
        //update cycle string
        cycleTimeString1 = String(t1StartHour) + " " + String(t1StartMin) + " " + String(t1EndHour) + " " + String(t1EndMin) + " " + String(cycleDur1) +" "+ String(repeatDur1);
    }
    adhocDur1 = 0; // should always be zero by now
}


void powerOff2() {
    powerState2 = LOW;
    digitalWrite(waterValve2, powerState2);

    // publish this last cycle to cloud, unless manuall shut off
    if(manualOff2==false){
        publishLastCycle2();
    }
    //if repeat frequency is set reset the alarm automatically, in increments of repeatDur
    if(repeatDur2>0 && manualOff2==false){
        t2StartHour = (t2StartHour+repeatDur2)%24;
        t2EndHour = (t2EndHour+repeatDur2)%24;
        onAlarmT2 = Alarm.alarmOnce(t2StartHour, t2StartMin, 0, powerOn2);
        //update cycle string
        cycleTimeString2 =  String(t2StartHour) + " " + String(t2StartMin) + " " + String(t2EndHour) + " " + String(t2EndMin)+ " " + String(cycleDur2) + " "+ String(repeatDur2);
    }
    adhocDur2 = 0; // should always be zero by now
}

void powerOff3() {
    powerState3 = LOW;
    digitalWrite(waterValve3, powerState3);

    // publish this last cycle to cloud, unless manuall shut off
    if(manualOff3==false){
        publishLastCycle3();
    }
    //if repeat frequency is set reset the alarm automatically, in increments of repeatDur
    if(repeatDur3>0 && manualOff3==false){
        t3StartHour = (t3StartHour+repeatDur3)%24;
        t3EndHour = (t3EndHour+repeatDur3)%24;
        onAlarmT3 = Alarm.alarmOnce(t3StartHour, t3StartMin, 0, powerOn3);
        //update cycle string
        cycleTimeString3 =  String(t3StartHour) + " " + String(t3StartMin) + " " + String(t3EndHour) + " " + String(t3EndMin)+ " " + String(cycleDur3) + " "+ String(repeatDur3);
    }
    adhocDur3 = 0; // should always be zero by now
}


//flow sensor interrupt-timer calculation
void msISR() {
    revPerMS = msCount;
    msCount = 0;
}
//flow sensor interrupt-timer calculation
void senseISR() {

    //******* FIX THIS -- litersPerMinute should be passed as arg~!!!! ********
    //******* FIX THIS -- litersPerMinute should be passed as arg~!!!! ********
    //******* FIX THIS -- litersPerMinute should be passed as arg~!!!! ********
    uint32_t us = micros();
    msCount++;
    pulseTotalPerCycle++;
    usDeltaTime = us - usLastTime;
    usLastTime = us;
    revPerSec =  1000000.0 / usDeltaTime;
    flowRate = (revPerSec * (1000.0/1.8));//1.8        //Take counted pulses in the last second and multiply by 2.25mL
    flowRate = flowRate * 60;         //Convert seconds to minutes, giving you mL / Minute
    float diff = abs((flowRate/1000)-litersPerMinute); // compare with previous reading
    if(diff<(litersPerMinute*flowThreshPct)){ //flow filter threshold is percentage of LPM
        litersPerMinute =(litersPerMinute + (flowRate / 1000))/2;       //Convert mL to Liters, giving you Liters / Minute
    }
}

float map(float x, float in_min, float in_max, float out_min, float out_max)
{
    return (x - in_min) * (out_max - out_min) / (in_max - in_min) + out_min;
}
