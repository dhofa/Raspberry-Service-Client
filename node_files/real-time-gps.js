var io = require('socket.io-client');
var sc = io.connect('https://rmvts.jagopesan.com/');
//var sc = io.connect('https://rmvts.herokuapp.com/');
//var sc = io.connect('http://192.168.8.101:3000/');
var Client = require('node-rest-client').Client;
var sleep = require('sleep').sleep;
var client = new Client();
var SerialPort = require('serialport');
var ReadLine   = SerialPort.parsers.Readline;
var GPS = require('gps');
var gps = new GPS;

const ID_USER        = "5b1d648ad429f20014b6e45e";  //user dhofa
const BASE_URL       = "https://rmvts.jagopesan.com/"
const BASE_GPS       = BASE_URL+"api/gps/${id_user}";

//membuka port /dev/ttyS0 yang terhubung ke GPS
var port = new SerialPort('/dev/ttyS0', { // change path
  baudRate : 9600
});


gps.on('data', function(data) {
//  console.log('latitude  :',gps.state.lat);
//  console.log('longitude :',gps.state.lon);
//  console.log(data);

   // save Data Gps
   if(data.lat != 0 && data.long != 0){
    console.log('latitude  :',data.lat);
    console.log('longitude :',data.lon);

    sc.emit('send_data_to_server', {latitude: data.lat, longitude: data.lon});
    setTimeout(function(){
      saveDataGPS(data.lat, data.lon);
    },5000);
   }
});

port.on('data', function(data) {
  gps.updatePartial(data);
});

function saveDataGPS(latitude, longitude){
  var args = {
    path   : { "id_user": ID_USER },
    data   : { latitude: latitude, longitude: longitude },
    headers: { "Content-Type": "application/json" }
  };

  client.post(BASE_GPS, args, function (data, response) {
   // console.log(response);
    console.log("Berhasil update GPS..");
  });
}

