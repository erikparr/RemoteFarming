// This #include statement was automatically added by the Particle IDE.
#include <HC_SR04.h>



//Voltage sensor vars
int analogInput = A1;
float vout = 0.0;
float vin = 0.0;
float R1 = 30000.0; //  
float R2 = 7500.0; // 
int value = 0;
int volt=0;
//ultrasonic sensor vars
int cm = 0;
int trigPin = D4;
int echoPin = D5;


HC_SR04 rangefinder = HC_SR04(trigPin, echoPin);



void setup() {
   pinMode(analogInput, INPUT);
   Serial.begin(9600);

   pinMode(D7, OUTPUT);
   Particle.variable("cm", &cm, INT);

   Particle.variable("volt", &volt, INT);


}


void loop() {
    cm = rangefinder.getDistanceCM();
    Serial.printf("Distance: %.2f cm\n", cm);

   // read the value at analog input
   value = analogRead(analogInput);
   vout = (value * 5.0) / 1024.0; // see text
   vin = vout / (R2/(R1+R2)); 
   volt = vin;
   
Serial.print("INPUT V= ");
Serial.println(vin,2);
delay(500);

}