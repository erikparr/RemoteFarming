// This #include statement was automatically added by the Particle IDE.
#include "TimeAlarms/TimeAlarms.h"

// for time sync and time management
#define ONE_DAY_MILLIS (24 * 60 * 60 * 1000)
#define ONE_HOUR_MILLIS (60 * 60 * 1000)
unsigned long dailyTimer = millis();
unsigned long hourlyTimer = millis();
bool bPublishData = false;


int photoresistor = A0; // This is where your photoresistor is plugged in. The other side goes to the "power" pin (below).
int power = A5; // This is the other end of your photoresistor. The other side is plugged into the "photoresistor" pin (above).
int analogvalue = 0;

//set these values from thingspeak
int todayVol = 0;
int lastDayVol = 0;
int secondDayVol = 0;
int thirdDayVol = 0;

int d1 = D6;
int d2 = D7;
int powerState1 = LOW;
int powerState2 = LOW;
int t1StartHour = 21;
int t1StartMin = 40;
int t1EndHour = 22;
int t1EndMin = 0;
int t2StartHour = 21;
int t2StartMin = 40;
int t2EndHour = 22;
int t2EndMin = 0;
int cycleDur1 =0;
int cycleDur2 =0;
int repeatDur1 =0;
int repeatDur2 =0;


unsigned long adhocDur1 = 0;
unsigned long adhocDur2 = 0;
unsigned long adhocTstamp1 = 0;
unsigned long adhocTstamp2 = 0;
int adhocTimer1 = 0;
int adhocTimer2 = 0;
bool bAdhocOn1 = false;
bool bAdhocOn2 = false;

String cycleTimeString = "";

//sensor variables
int dvol1 = 0;
int dvol2 = 0;
int dFlowRt1 = 0;
int dFlowRt2 = 0;
int dFlowAnm1 = 0;
int dFlowAnm2 = 0;
int dTemp = 0;
int dHum = 0;


AlarmID_t onAlarmT1;
AlarmID_t offAlarmT1;
AlarmID_t onAlarmT2;
AlarmID_t offAlarmT2;

void setup() {
    // AlarmID_t onAlarmT1 = Alarm.alarmOnce(t1StartHour,t1StartMin,0, powerOn1);
    // AlarmID_t offAlarmT1 = Alarm.alarmOnce(t1EndHour,t1EndMin,0, powerOff1);
    // AlarmID_t onAlarmT2 = Alarm.alarmOnce(t2StartHour,t2StartMin,0, powerOn2);
    // AlarmID_t offAlarmT2 = Alarm.alarmOnce(t2EndHour,t2EndMin,0, powerOff2);



    dailySync(); //sync time
    // Serial.begin(9600);
    pinMode(photoresistor, INPUT);
    pinMode(power, OUTPUT); // The pin powering the photoresistor is output (sending out consistent power)
    digitalWrite(power, HIGH);
    Particle.variable("analogvalue", &analogvalue, INT);


    Alarm.alarmRepeat(3, 00, 0, dailyTasks); //  at 3AM every day
    pinMode(d1, OUTPUT);
    pinMode(d2, OUTPUT);
    /*Particle.function("led",powerToggle);*/
    Particle.function("setAlarm", resetAlarmTime); // set alarms for watering cycles
    Particle.function("setAdhoc", setAdhocTime); // set ad hoc watering control
    //   Particle.function("getcycleTimeString", cycleTimeString);
    Particle.variable("runState1", &powerState1, INT);
    Particle.variable("runState2", &powerState2, INT);
    Particle.variable("cycleTime", &cycleTimeString, STRING);
    Particle.variable("ahocTimer1", &adhocTimer1, INT);
    Particle.variable("ahocTimer2", &adhocTimer2, INT);


    cycleTimeString = String(t1StartHour) + " " + String(t1StartMin) + " " + String(t1EndHour) + " " + String(t1EndMin) + " " + String(cycleDur1) +" "+ String(repeatDur1) + " " + String(t2StartHour) + " " + String(t2StartMin) + " " + String(t2EndHour) + " " + String(t2EndMin)+ " " + String(cycleDur2) + " "+ String(repeatDur2);




    //p1data_request
    //    Particle.subscribe("hook-response/getLast", getLastHandler, MY_DEVICES);


    digitalWrite(d1, LOW);
    digitalWrite(d2, LOW);

    //*** SCHEDULING ***
    //Berlin time zone
    Time.zone(1.0);
}



void loop() {
    // !Must have this for alarm to update!
    Alarm.delay(100);
    manageTime();
    analogvalue = analogRead(photoresistor);

    //bPublishData returns true once an hour
    if (bPublishData == true) {
        publishHourly();
    }
    delay(100); // update only once a second

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
        adhocTstamp1 = millis();
        bAdhocOn1 = true;

    } else if (index == 1) {
        powerOn2();
        adhocDur2 = values[1] * 60 * 1000; //get in MILLIS
        adhocTstamp2 = millis();
        bAdhocOn2 = true;
    }

    return 1;
}



int resetAlarmTime(String timeString) {
    //first, publish last cycle to cloud
    publishLastCycle();

    Alarm.free(onAlarmT1);//free previous alarms
    Alarm.free(offAlarmT1);
    Alarm.free(onAlarmT2);//free previous alarms
    Alarm.free(offAlarmT2);

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
        t1StartHour = values[1];
        t1StartMin = values[2];
        t1EndHour = values[3];
        t1EndMin = values[4];
        cycleDur1 = values[5];
        repeatDur1 = values[6];

        //set specific irrigation alarm according to systemID
        onAlarmT1 = Alarm.alarmOnce(t1StartHour, t1StartMin, 0, powerOn1);



    } else if (index == 1) {
        t2StartHour = values[1];
        t2StartMin = values[2];
        t2EndHour = values[3];
        t2EndMin = values[4];
        cycleDur2 = values[5];
        repeatDur2 = values[6];

        //set specific irrigation alarm according to systemID
        onAlarmT2 = Alarm.alarmOnce(t2StartHour, t2StartMin, 0, powerOn2);



    }

    cycleTimeString = String(t1StartHour) + " " + String(t1StartMin) + " " + String(t1EndHour) + " " + String(t1EndMin) + " " + String(cycleDur1) +" "+ String(repeatDur1) + " " + String(t2StartHour) + " " + String(t2StartMin) + " " + String(t2EndHour) + " " + String(t2EndMin)+ " " + String(cycleDur2) + " "+ String(repeatDur2);


    return 1;
}



void manageTime() {
    //set publish boolean once an hour
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
    //keep track of time remaining on adhoc for web display. convert to minutes: 60000 millis
    adhocTimer1 = max(0, ((int)(adhocDur1 / 60000)) - ((int)(millis() - adhocTstamp1) / 60000));
    adhocTimer2 = max(0, ((int)(adhocDur2 / 60000)) - ((int)(millis() - adhocTstamp2) / 60000));

}

// once an hour we publish all our data to the cloud
void publishHourly() {
    //DEVICE: Irrigation-Particle1
    //IRRIGATION SYSTEM 1
    /*Particle.publish("analogRead",String(analogvalue),PRIVATE);*/
}



void publishDaily() {

    Particle.publish("dVol", String(dvol1) + " " + String(dvol2), PRIVATE); //Volume / Cycle
    Particle.publish("dFlowRt", String(dFlowRt1) + " " + String(dFlowRt2), PRIVATE); //Flow Rate
    Particle.publish("dFlowAnm", String(dFlowAnm1) + " " + String(dFlowAnm2), PRIVATE); //Flow Anomaly

    Particle.publish("dTemp", String(random(10) + 20), PRIVATE); //Temp
    Particle.publish("dHum", String(random(100)), PRIVATE); //Hum
    // Particle.publish("d1s1Volt",String(0.0),PRIVATE); //Voltage

    Particle.publish("volData", String(todayVol) + " " + String(lastDayVol) + " " + String(secondDayVol) + " " + String(thirdDayVol), PRIVATE); //all the volume data

    bPublishData = false;

    /*Particle.publish("lastCycle",String(t1StartHour)+" "+String(t1StartMin)+" "+String(t1EndHour)+" "+String(t1EndMin),PRIVATE); //Volume*/
}



void publishLastCycle() {

    Particle.publish("lastCycle", cycleTimeString, PRIVATE); //Volume

}

void calculateDailyVol() {
    // calculate volume here

}

//do once a day
void dailyTasks() {

    calculateDailyVol();
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
    powerState1 = HIGH;
    digitalWrite(d1, powerState1);
    offAlarmT1 = Alarm.alarmOnce(t1EndHour, t1EndMin, 0, powerOff1);


}

void powerOn2() {
    powerState2 = HIGH;
    digitalWrite(d2, powerState2);
    offAlarmT2 = Alarm.alarmOnce(t2EndHour, t2EndMin, 0, powerOff2);



}

void powerOff1() {
    powerState1 = LOW;
    digitalWrite(d1, powerState1);

//if repeat frequency is set reset the alarm automatically, in increments of repeatDur
    if(repeatDur1>0){
    t1StartHour = (t1StartHour+repeatDur1)%24;
    t1EndHour = (t1EndHour+repeatDur1)%24;
    onAlarmT1 = Alarm.alarmOnce(t1StartHour, t1StartMin, 0, powerOn1);
    }
}


void powerOff2() {
    powerState2 = LOW;
    digitalWrite(d2, powerState2);

//if repeat frequency is set reset the alarm automatically, in increments of repeatDur
    if(repeatDur2>0){
    t2StartHour = (t2StartHour+repeatDur2)%24;
    t2EndHour = (t2EndHour+repeatDur2)%24;
    onAlarmT2 = Alarm.alarmOnce(t2StartHour, t2StartMin, 0, powerOn2);
    }
}



/*// toggle on/off
int powerToggle(String command) {

    if (command=="1") {
        powerState = HIGH;
        digitalWrite(d1,powerState);
        digitalWrite(d2,powerState);
        return 1;
    }
    else if (command=="0") {
        powerState = LOW;
        digitalWrite(d1,powerState);
        digitalWrite(d2,powerState);
        return 0;
    }
    else {
        return -1;
    }
}
*/
