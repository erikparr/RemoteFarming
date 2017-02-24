

// This #include statement was automatically added by the Particle IDE.
#include "TimeAlarms/TimeAlarms.h"

// for time sync and time management
#define ONE_DAY_MILLIS (24 * 60 * 60 * 1000)
#define ONE_HOUR_MILLIS (60 * 60 * 1000)
unsigned long lastSync = millis();
unsigned long lastPublish = millis();
bool bPublishData = false;


int photoresistor = A0; // This is where your photoresistor is plugged in. The other side goes to the "power" pin (below).
int power = A5; // This is the other end of your photoresistor. The other side is plugged into the "photoresistor" pin (above).
int analogvalue=0;

//set these values from thingspeak
int todayVol=0;
int lastDayVol=0;
int secondDayVol=0;
int thirdDayVol=0;

int led1 = D0;
int led2 = D7;
int stateLed = LOW;
int t1StartHour = 12;
int t1StartMin = 0;
int t1EndHour = 12;
int t1EndMin = 30;
String timeStringT1="";

AlarmID_t onAlarmT1 = Alarm.alarmOnce(t1StartHour,t1StartMin,0, timedPowerOn);
AlarmID_t offAlarmT1 = Alarm.alarmOnce(t1EndHour,t1EndMin,0, timedPowerOff);


void setup()
{

    pinMode(photoresistor,INPUT);
    pinMode(power,OUTPUT); // The pin powering the photoresistor is output (sending out consistent power)
    digitalWrite(power,HIGH);
    Particle.variable("analogvalue", &analogvalue, INT);

    
    Alarm.alarmRepeat(3,00,0, publishEvents);  //  at 3AM every day

   
    pinMode(led1, OUTPUT);
   pinMode(led2, OUTPUT);

   Particle.function("led",ledToggle);
      Particle.function("setAlarm", resetAlarmTime);
        //   Particle.function("getTimeStringT1", timeStringT1);
     Particle.variable("ledState", &stateLed, INT);
     Particle.variable("getTimeStrT1", &timeStringT1, STRING);
    timeStringT1 = String(t1StartHour)+" "+String(t1StartMin)+" "+String(t1EndHour)+" "+String(t1EndMin);

//p1data_request
Particle.subscribe("hook-response/getLast", getLastHandler, MY_DEVICES);


    digitalWrite(led1, LOW);
   digitalWrite(led2, LOW);

   //*** SCHEDULING ***
   //Berlin time zone
   Time.zone(1.0);
}



void loop()
{
    // !Must have this for alarm to update!
    Alarm.delay(100);
    manageTime();
    analogvalue = analogRead(photoresistor);
    if(bPublishData==true){
        publishEvents();
    }
    delay(100);

//     if(Time.hour == t1StartHour && Time.minute == t1StartMin && stateLed==LOW){
//         timedPowerOn();
//     }
//         if(Time.hour == t1EndHour && Time.minute == t1EndMin && stateLed==HIGH){
//         timedPowerOff();
// }
}


int resetAlarmTime(String timeString){
    // String[] list = split(timeString, " ");
    //  t1StartHour = list[0].toInt();
    //  t1StartMin = list[1].toInt();
    //  t1EndHour = list[2].toInt();
    //  t1EndMin = list[3].toInt();

    //first, publish last cycle to cloud
    Particle.publish("lastCycle",String(t1StartHour)+" "+String(t1StartMin)+" "+String(t1EndHour)+" "+String(t1EndMin),PRIVATE); //Volume

    Alarm.free(onAlarmT1);
    Alarm.free(offAlarmT1);

    char charBuf[20];
    timeString.toCharArray(charBuf, 20);

    //Begin black magic supplied by @mdma at:
    // https://community.spark.io/t/gpio-control-via-gui/6310/7
    const int value_count = 8;  // the maximum number of values
    int values[value_count];    // store the values here

    char string[20];
    strcpy(string, charBuf);  // the string to split
    int idx = 0;
    for (char* pt=strtok(string, " "); pt && idx<value_count; pt=strtok(NULL, " ")) {
       values[idx++] = atoi(pt);
    }
    //End black magic.

    t1StartHour = values[0];
    t1StartMin = values[1];
    t1EndHour = values[2];
    t1EndMin = values[3];
    timeStringT1 = String(t1StartHour)+" "+String(t1StartMin)+" "+String(t1EndHour)+" "+String(t1EndMin);

    onAlarmT1 = Alarm.alarmOnce(t1StartHour,t1StartMin,0, timedPowerOn);
    offAlarmT1 = Alarm.alarmOnce(t1StartHour,t1StartMin,0, timedPowerOff);
    return 1;
}

void timedPowerOn(){
    stateLed = HIGH;
        digitalWrite(led1,stateLed);
        digitalWrite(led2,stateLed);
}

void timedPowerOff(){
    stateLed = LOW;
        digitalWrite(led1,stateLed);
        digitalWrite(led2,stateLed);
}


void manageTime() {
    //set publish boolean once an hour
    if(millis() - lastPublish > ONE_HOUR_MILLIS){
            bPublishData = true;
            lastPublish = millis();
    }
    //sync time once a day
  if (millis() - lastSync > ONE_DAY_MILLIS) {
    // Request time synchronization from the Particle Cloud
    Particle.syncTime();
    lastSync = millis();
  }
}

// once an hour we publish all our data to the cloud
void publishEvents(){

    //DEVICE: Irrigation-Particle1
    //IRRIGATION SYSTEM 1
        Particle.publish("analogRead",String(analogvalue),PRIVATE);
        Particle.publish("d1s1Vol",String(0.0),PRIVATE); //Volume
        Particle.publish("lastCycle",String(t1StartHour)+" "+String(t1StartMin)+" "+String(t1EndHour)+" "+String(t1EndMin)+" "+String(1)+" "+" "+String(2)+" "+" "+String(3),PRIVATE); //Volume

        // Particle.publish("d1s1Flow",String(0.0),PRIVATE); //Flow
        // Particle.publish("d1s1FlowAnm",String(0.0),PRIVATE); //Flow Anomaly
        // Particle.publish("d1s1VolTtl",String(0.0),PRIVATE); //Flow Vol Total
        // Particle.publish("d1s1Temp",String(0.0),PRIVATE); //Temp
        // Particle.publish("d1s1Hum",String(0.0),PRIVATE); //Hum
        // Particle.publish("d1s1Volt",String(0.0),PRIVATE); //Voltage

                bPublishData = false;
}

//

int ledToggle(String command) {

    if (command=="1") {
        stateLed = HIGH;
        digitalWrite(led1,stateLed);
        digitalWrite(led2,stateLed);
        return 1;
    }
    else if (command=="0") {
        stateLed = LOW;
        digitalWrite(led1,stateLed);
        digitalWrite(led2,stateLed);
        return 0;
    }
    else {
        return -1;
    }
}

void publishDataLog(){
  Particle.publish("getLast", "data", PRIVATE);
  /*Particle.publish("lastCycle",String(t1StartHour)+" "+String(t1StartMin)+" "+String(t1EndHour)+" "+String(t1EndMin),PRIVATE); //Volume*/

}


  void getLastHandler(const char *event, const char *data) {


  //Begin black magic supplied by @mdma at:
  // https://community.spark.io/t/gpio-control-via-gui/6310/7
  const int value_count = 8;  // the maximum number of values
  int values[value_count];    // store the values here

  char string[20];
  strcpy(string, data);  // the string to split
  int idx = 0;
  for (char* pt=strtok(string, " "); pt && idx<value_count; pt=strtok(NULL, " ")) {
     values[idx++] = atoi(pt);
  }
  //End black magic.
  lastDayVol=values[4];
  secondDayVol=values[5];
  thirdDayVol=values[6];



}

