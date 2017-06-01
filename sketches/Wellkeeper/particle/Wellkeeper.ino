// This #include statement was automatically added by the Particle IDE.
#include <HC_SR04.h>



//Voltage sensor vars
int voltageInput = A1;
float vout = 0.0;
float vin = 0.0;
float R1 = 30000.0; //
float R2 = 7500.0; //
float voltValue = 0;
float volt=0;
String voltString ="";
//ultrasonic sensor vars
double cm = 0.0;
String tankLiters = "";
int trigPin = D4;
int echoPin = D5;
bool isActive = true;
int pirPin = D6;              // choose the input pin (for PIR sensor)
int alarmLightPin = D7;                // alarm Lighting Pin
int pirState = LOW;             // we start, assuming no motion detected
int pirValue = 0;                    // variable for reading the pir pin status
String cmString="";
String deviceID = "";
HC_SR04 rangefinder = HC_SR04(trigPin, echoPin);



void setup() {
    pinMode(voltageInput, INPUT);
    Serial.begin(9600);
    
    
    pinMode( alarmLightPin, OUTPUT );
    pinMode(pirPin, INPUT);     // declare sensor as input
    
    
    Particle.variable("tankLiters", &tankLiters, STRING);
    Particle.variable("volt", &voltString, STRING);
    
    Particle.variable("active", isActive);
    Particle.function("setActive", setActiveState); // set alarms for watering cycles
    
    Particle.variable("deviceID", &deviceID, STRING);
    Particle.variable("cm", &cmString, STRING);
    deviceID = Particle.deviceID(); //display the ID of this particle
    
    
    
    
}


void loop() {
    
    cm = rangefinder.getDistanceCM();
    cmString = String(cm);
    tankLiters = String(65000 - ((cm-15)*255));
    
    Serial.printf("Distance: %.2f cm\n", cm);
    
    if(isActive){
        //pir sensing
        pirValue = digitalRead(pirPin);
        // report it out, if the state has changed
        reportTheData();
    }
    
    // read the value at analog input
    voltValue = analogRead(voltageInput);
    vout = (voltValue * 5.0) / 1024.0; // see text
    vin = vout / (R2/(R1+R2));
    volt = vin/6;
    voltString = String(volt);
    
    Serial.print("INPUT V= ");
    Serial.println(vin,2);
    delay(500);
    
    
    
    
    
}

void reportTheData() {
    if (pirValue == HIGH) {            // check if the input is HIGH
        digitalWrite(alarmLightPin, HIGH);  // turn LED ON
        if (pirState == LOW) {
            // we have just turned on
            Serial.println("Motion detected!");
            // We only want to print on the output change, not state
            pirState = HIGH;
        }
    } else {
        digitalWrite(alarmLightPin, LOW); // turn LED OFF
        if (pirState == HIGH){
            // we have just turned of
            Serial.println("Motion ended!");
            // We only want to print on the output change, not state
            pirState = LOW;
        }
    }
}

int setActiveState(String stringState){
    int intBool = atoi(stringState); //are you a zero or are you a one?
    isActive = intBool;
    return 0;
}

