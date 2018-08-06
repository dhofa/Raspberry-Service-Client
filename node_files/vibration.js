var io = require('socket.io-client');
var sc = io.connect('https://rmvts.jagopesan.com/');
//var sc = io.connect('https://rmvts.herokuapp.com/');
//var sc = io.connect('http://192.168.8.100:3000/');
var exec = require('child_process').exec;
var gpio = require('onoff').Gpio;
var Client = require('node-rest-client').Client;
var sleep = require('sleep').sleep;
var client = new Client();

//declare base URL API
const ID_USER        = "5b1d648ad429f20014b6e45e";  //user dhofa
const BASE_URL       = "https://rmvts.jagopesan.com/"
const BASE_VIBRATION = BASE_URL+"api/log-vibration/create/${id_user}";
const BASE_NOTIFICATION= BASE_URL+"api/notification/create/${id_user}";
const VIBRATION      = new gpio(21,'in','both');

VIBRATION.watch(function (err, value){
   var i =0;
   if(value == 1){
    i++;
   }
   console.log('Vibration are detected',i);
   if(i%500 == 0){
   // createLogActivity(BASE_VIBRATION,"Vibration Notification", "Vibration d$
    sc.emit('relay1', {msg:true});
    //createLogActivity(BASE_VIBRATION,"Vibration Notification", "Vibration detected with value please check in the app..");
   }
   // default 1 menit alarm mati
   setTimeout(function(){
    sc.emit('relay1', {msg:false});
   },30000);
});

function createLogActivity(url,title,message){
  var args = {
    path   : { "id_user": ID_USER },
    data   : { title: title, detail: message },
    headers: { "Content-Type": "application/json" }
  };

  client.post(url, args, function (data, response) {
    console.log(response);
    console.log("Berhasil "+message);
  });

  createNotification(title, message);
}


function createNotification(title,message){
  var args = {
    path   : { "id_user": ID_USER },
    data   : { title: title, message: message },
    headers: { "Content-Type": "application/json" }
  };

  client.post(BASE_NOTIFICATION, args, function (data, response) {
    console.log(response);
    console.log("Berhasil "+message);
  });
}

