// This #include statement was automatically added by the Particle IDE.
#include "TimeAlarms/TimeAlarms.h"

// for time sync once a day
#define ONE_DAY_MILLIS (24 * 60 * 60 * 1000)
unsigned long lastSync = millis();

AlarmID_t alarmT1;



int led1 = D0;
int led2 = D7;
int stateLed = LOW;
int t1StartHour = 12;
int t1StartMin = 0;
int t1EndHour = 12;
int t1EndMin = 30;

void setup()
{

   pinMode(led1, OUTPUT);
   pinMode(led2, OUTPUT);

   Particle.function("led",ledToggle);
      Particle.function("setAlarm", resetAlarmTime);

    //   Particle.function("setStrtHr1",setStartHrT1);
    //   Particle.function("setStrtMin1",setStartMinT1);
    //   Particle.function("setEndHr1",setEndHourT1);
    //   Particle.function("setEndMin1",setEndMinT1);


     Particle.variable("ledState", &stateLed, INT);
     Particle.variable("StartHourT1", &t1StartHour, INT);
     Particle.variable("StartMinT1", &t1StartMin, INT);
     Particle.variable("EndHourT1", &t1EndHour, INT);
     Particle.variable("EndMinT1", &t1EndMin, INT);



    digitalWrite(led1, LOW);
   digitalWrite(led2, LOW);
   
   //*** SCHEDULING ***
   //Berlin time zone
   Time.zone(1.0);
      // create the alarms 
      alarmT1 = Alarm.alarmOnce(t1StartHour,t1StartMin,0, timedPowerOn); 


    //   Alarm.alarmRepeat(t1EndHour,t1EndMin,0, timedPowerOff); 


}



void loop()
{
    // !Must have this for alarm to update!
    Alarm.delay(100);
    syncTime();
    
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
    Alarm.free(alarmT1);
    
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
    
    alarmT1 = Alarm.alarmOnce(t1StartHour,t1StartMin,0, timedPowerOn); 

}

int setStartHrT1(String startHour){
     t1StartHour = startHour.toInt();
     
     return t1StartHour;
}

int setStartMinT1(String startMin){
     t1StartMin = startMin.toInt();
     return t1StartMin;
}

int setEndHourT1(String endHour){
     t1EndHour = endHour.toInt();
     return t1EndHour;
}

int setEndMinT1(String endMin){
     t1EndMin = endMin.toInt();
     return t1EndMin;
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


void syncTime() {
  if (millis() - lastSync > ONE_DAY_MILLIS) {
    // Request time synchronization from the Particle Cloud
    Particle.syncTime();
    lastSync = millis();
  }
}


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

