ar io = require('socket.io-client');
var sc = io.connect('https://rmvts.jagopesan.com/');
//var sc = io.connect('https://rmvts.herokuapp.com/');
//var sc = io.connect('http://192.168.8.100:3000/');
var exec = require('child_process').exec;
var gpio = require('onoff').Gpio;
var Client = require('node-rest-client').Client;
var sleep = require('sleep').sleep;
var client = new Client();

VIBRATION.watch(function (err, value){
   if(value == 1){
    i++;
   }
   console.log('Vibration are detected',i);
   if(i%500 == 0){
   // createLogActivity(BASE_VIBRATION,"Vibration Notification", "Vibration d$
    sc.emit('relay1', {msg:true});
   }
   // default 1 menit alarm mati
   setTimeout(function(){
    sc.emit('relay1', {msg:false});
   },60000);
});
