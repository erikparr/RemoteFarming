
int led1 = D0;
int led2 = D7;
int stateLed = LOW;

void setup()
{

   pinMode(led1, OUTPUT);
   pinMode(led2, OUTPUT);

   Particle.function("led",ledToggle);
     Particle.variable("ledState", &stateLed, INT);

digitalWrite(led1, LOW);
   digitalWrite(led2, LOW);

}

void loop()
{
}


int ledToggle(String command) {

    if (command=="1") {
        digitalWrite(led1,HIGH);
        digitalWrite(led2,HIGH);
        stateLed = HIGH;
        return 1;
    }
    else if (command=="0") {
        digitalWrite(led1,LOW);
        digitalWrite(led2,LOW);
        stateLed = LOW;

        return 0;
    }
    else {
        return -1;
    }
}
