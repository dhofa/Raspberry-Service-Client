var io = require('socket.io-client');
var sc = io.connect('https://rmvts.jagopesan.com/');
//var sc = io.connect('https://rmvts.herokuapp.com/');
//var sc = io.connect('http://192.168.8.101:3000/');
var SerialPort = require('serialport');
var ReadLine   = SerialPort.parsers.Readline;
var GPS = require('gps');
var gps = new GPS;

//membuka port /dev/ttyS0 yang terhubung ke GPS
var port = new SerialPort('/dev/ttyAMA0', { // change path
  baudRate : 115200
});


gps.on('data', function(data) {
//  console.log('latitude  :',gps.state.lat);
//  console.log('longitude :',gps.state.lon);
  console.log('latitude  :',data.lat);
  console.log('longitude :',data.lon);
//  console.log(data);

  sc.emit('send_data_to_server', {latitude: data.lat, longitude: data.lon});
});

port.on('data', function(data) {
  gps.updatePartial(data);
});
