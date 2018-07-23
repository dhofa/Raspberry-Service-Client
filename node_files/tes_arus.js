var io = require('socket.io-client');
var sc = io.connect('https://rmvts.jagopesan.com/');
//var sc = io.connect('https://rmvts.herokuapp.com/');
//var sc = io.connect('http://192.168.8.100:3000/');
var exec = require('child_process').exec;
var gpio = require('onoff').Gpio;
var Client = require('node-rest-client').Client;
var sleep = require('sleep').sleep;
var client = new Client();

//declare Pin untuk relay
var RELAY1   = new gpio(4, 'out');
var RELAY2   = new gpio(17,'out');
var RELAY3   = new gpio(27,'out');
var RELAY4   = new gpio(22,'out');
var ARUS     = new gpio(25,'in','both');
var VIBRATION = new gpio(21,'in','both');

//declare base URL API
const ID_USER        = "5b1d648ad429f20014b6e45e";  //user dhofa
//const BASE_URL       = "http://192.168.8.100:3000/"
//const BASE_URL       = "https://rmvts.herokuapp.com/"
const BASE_URL       = "https://rmvts.jagopesan.com/"
const BASE_BUZZER    = BASE_URL+"api/log-buzzer/create/${id_user}";
const BASE_VIBRATION = BASE_URL+"api/log-vibration/create/${id_user}";
const BASE_IGNITION  = BASE_URL+"api/log-ignition/create/${id_user}";
//Base Relay
const RELAY_GPS      = BASE_URL+"api/update-relay/gps/${id_user}";
const RELAY_IGNITION_ON  = BASE_URL+"api/update-relay/ignition_on/${id_user}";
const RELAY_IGNITION_OFF = BASE_URL+"api/update-relay/ignition_off/${id_user}";
const RELAY_VIBRATION= BASE_URL+"api/update-relay/vibration/${id_user}";
const RELAY_BUZZER   = BASE_URL+"api/update-relay/buzzer/${id_user}";
const UPDATE_IGNITION= BASE_URL+"api/update-status-ignition/${id_user}";
const BASE_RELAY_STATE = BASE_URL+"api/get-relay-state/${id_user}";
//settup capture image
const LOKASI_FOTO      = "/home/pi/FILE_FOTO/";
const BASE_UPLOAD_FOTO = BASE_URL+"api/images/upload";
const BASE_NOTIFICATION= BASE_URL+"api/notification/create/${id_user}";

//settup state relay from API
//getStateRelay(BASE_RELAY_STATE,ID_USER);

ARUS.watch(function(err, value){
  console.log(value);

 if(err){
  console.log('Error while Watching Current Sensor..');
 }
 if(value == 1){
  console.log('Arus terdeteksi !');

  setTimeout(function(){
   sc.emit('activate_realtime_maps', {msg:true});
  }, 60000);

 }else{
  console.log('tidak ada arus listrik ');
 }
});

