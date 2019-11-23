/**
 * 浆料箱
 * 箱内温度：0-60
 * 重量：0-1000
 */

//Requires node.js and mqtt library installed.
var mqtt = require('mqtt');
 
// Reads the tb host from arguments
const thingsboardHost = process.argv[2];
// Reads the access token from arguments
const accessToken = process.argv[3];
const minTemperature = 0, maxTemperature = 60, minWeight = 0, maxWeight = 1000;
 
// Initialization of temperature and weight data with random values
var data = {
    temperature: minTemperature + (maxTemperature - minTemperature) * Math.random() ,
    weight: minWeight + (maxWeight - minWeight) * Math.random()
};
 
// Initialization of mqtt client using Thingsboard host and device access token
console.log('Connecting to: %s using access token: %s', thingsboardHost, accessToken);
var client  = mqtt.connect('mqtt://'+ thingsboardHost, { username: accessToken });
 
// Triggers when client is successfully connected to the Thingsboard server
client.on('connect', function () {
    console.log('Client connected!');
    // Uploads firmware version as device attribute using 'v1/devices/me/attributes' MQTT topic
    client.publish('v1/devices/me/attributes', JSON.stringify({"firmware_version":"1.0.1"}));
    // Schedules telemetry data upload once per second
    console.log('Uploading temperature and weight data once per second...');
    setInterval(publishTelemetry, 1000);
});
 
// Uploads telemetry data using 'v1/devices/me/telemetry' MQTT topic
function publishTelemetry() {
    data.temperature = genNextValue(data.temperature, minTemperature, maxTemperature);
    data.weight = genNextValue(data.weight, minWeight, maxWeight);
    client.publish('v1/devices/me/telemetry', JSON.stringify(data));
}
 
// Generates new random value that is within 3% range from previous value
function genNextValue(prevValue, min, max) {
    var value = prevValue + ((max - min) * (Math.random() - 0.5)) * 0.03;
    value = Math.max(min, Math.min(max, value));
    return Math.round(value * 10) / 10;
}
 
//Catches ctrl+c event
process.on('SIGINT', function () {
    console.log();
    console.log('Disconnecting...');
    client.end();
    console.log('Exited!');
    process.exit(2);
});
 
//Catches uncaught exceptions
process.on('uncaughtException', function(e) {
    console.log('Uncaught Exception...');
    console.log(e.stack);
    process.exit(99);
});