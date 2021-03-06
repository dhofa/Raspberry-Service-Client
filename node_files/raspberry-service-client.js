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
getStateRelay(BASE_RELAY_STATE,ID_USER);

ARUS.watch(function(err, value){
 if(err){
  console.log('Error while Watching Current Sensor..');
 }
 if(value == 1){
  console.log('Arus terdeteksi !');

  setTimeout(function(){
   sc.emit('activate_realtime_gps', {msg:true});
  }, 60000);

  updateStatusIgnition(UPDATE_IGNITION,"Aktif");

 }else{
  console.log('tidak ada arus listrik ');
 }
});

sc.on('relay1', (data) => {
 if(data.msg){
  console.log('relay1 aktif');
  RELAY1.writeSync(1);
  updateRelay(RELAY_BUZZER,true);
  createLogActivity(BASE_BUZZER,"Buzzer Notification", "Your Buzzer Already Running");

  //menjalankan alarm
  exec('sudo systemctl start buzzer.service', (err, stout, sterr) => {
   if(err !== null){
    console.log('exec error: ', err);
   }
  });
 }
 else{
  RELAY1.writeSync(0);
  console.log('relay1 non aktif');
  updateRelay(RELAY_BUZZER,false);
  createLogActivity(BASE_BUZZER,"Buzzer Turned Off", "Your Buzzer Turned Off");

  //menonaktifkan alarm
  exec('sudo systemctl stop buzzer.service', (err, stout, sterr) => {
   if(err !== null){
    console.log('exec error: ', err);
   }
  });
 }
});

sc.on('relay2', (data) =>{
 if(data.msg){
  RELAY2.writeSync(0); //untuk mematikan paksa
  console.log('cut off ignition on');
  console.log('relay 2 turned off');
  sc.emit('relay3', {msg:false});
  console.log('relay 3 turned off'); //shoud save state relay again
  sc.emit('relay4', {msg:false});
  console.log('relay 4 turned off'); //shoud save state relay again
  sc.emit('relay4_web_reply', {msg:true});
  createLogActivity(BASE_IGNITION,"Turn Off Ignition", "You're Enable fitur turned OFF Ignition");
  updateRelay(RELAY_IGNITION_OFF,true);
 }else{
  RELAY2.writeSync(1);
  console.log('relay 2 turned on');
  createLogActivity(BASE_IGNITION,"Turn Off Ignition", "You're dissable fitur turned OFF Ignition");
  updateRelay(RELAY_IGNITION_OFF,false);
 }
});


sc.on('vibration', (data) =>{
 if(data.msg){
  console.log('Vibration Active..');
  console.log('Parking Mode On..');
  updateRelay(RELAY_VIBRATION,true);

  //mengaktifkan vibration service
  exec('sudo systemctl start web-vibration.service', (err, stout, sterr) => {
   if(err !== null){
    console.log('Error mengaktifkan vibration service');
   }
  });

 }else{
  console.log('Parking Mode Turned Off..');
  updateRelay(RELAY_VIBRATION,false);
  //mematikan vibration service
  exec('sudo systemctl stop web-vibration.service', (err, stout, sterr) => {
   if(err !== null){
    console.log('Error menghentikan vibration service');
   }
  });
 }
});

sc.on('relay3', (data) =>{
 if(data.msg){
  RELAY3.writeSync(1);
  console.log('vehicle electricity on..');
  updateRelay(RELAY_IGNITION_ON,true);
  createLogActivity(BASE_IGNITION,"Ignition Notification", "Ignition state are turned on");
 }else{
  RELAY3.writeSync(0);
  RELAY4.writeSync(0);
  console.log('vehicle electricity off..');
  updateRelay(RELAY_IGNITION_ON,false);
  createLogActivity(BASE_IGNITION,"Ignition Notification", "Ignition state are turned off");
 }
});


sc.on('relay4', (data) =>{
 if(data.msg){
  RELAY4.writeSync(1);
  console.log('starting up machine..');
 }else{
  RELAY4.writeSync(0);
  console.log('stop starting up..');
 }
});


sc.on('relay4_web', (data) =>{
 if(data.msg){
  RELAY4.writeSync(1);
  console.log('starting up machine..');
  sleep(1);
  RELAY4.writeSync(0);
  console.log('stop starting up machine..');
  sc.emit('relay4_web_reply', {msg:true});
 }
});


sc.on('ambilfoto', (data) => {
 console.log('menjalankan FOTO');
 exec('raspistill -o '+LOKASI_FOTO+data.msg+'.jpg', (err, stout, sterr) => {
  console.log('stout: ', stout);
  console.log('sterr: ', sterr);
  //exec("curl -F file_foto=@/home/pi/"+data.msg+".jpg https://rmvts.herokuapp.com/api/images/upload", (err, stout, sterr) => {
  exec("curl -F id_user="+ID_USER+" -F file_foto=@"+LOKASI_FOTO+data.msg+".jpg "+BASE_UPLOAD_FOTO, (err, stout, sterr) => {
   console.log('stout: ', stout);
   console.log('sterr: ', sterr);
   sc.emit('refresh_foto', {msg:true});
  });
 });
});

sc.on('activate_realtime_gps', (data) => {
 if(data.msg){
  console.log('menjalankan Realtime GPS');
  //mematikan service python Gps
  exec('sudo systemctl stop web-python-gps.service', (err, stout, sterr) => {
   if(err !== null){
    console.log('Error menghentikan python gps Service');
   }
   updateRelay(RELAY_GPS,false);
  });
  exec('sudo systemctl start web-log-gps.service', (err, stout, sterr) => {
   if(err !== null){
    console.log('Error mengaktifkan node Gps Service');
   }
  });
 }
 else{
  console.log('menghentikan Realtime GPS');
  exec('sudo systemctl stop web-log-gps.service', (err, stout, sterr) => {
   if(err !== null){
    console.log('Error menghentikan node gps service');
   }
  });
 }
});

sc.on('activate_python_gps', (data) => {
 if(data.msg){
  console.log('menjalankan service python GPS');
  updateRelay(RELAY_GPS,true);
  //menghentikan service node.js
  exec('sudo systemctl stop web-log-gps.service', (err, stout, sterr) => {
   if(err !== null){
    console.log('Error menghentikan node gps service');
   }
  });

  exec('sudo systemctl start web-python-gps.service', (err, stout, sterr) => {
   if(err !== null){
    console.log('Error mengaktifkan python gps service');
    updateRelay(RELAY_GPS,false);
   }
  });
 }
 else{
  console.log('menghentikan python gps service');
  updateRelay(RELAY_GPS,false);

  exec('sudo systemctl stop web-log-gps.service', (err, stout, sterr) => {
   if(err !== null){
    console.log('stop log gps error: ', err);
   }
  });
 }
});


function updateRelay(url, status){
  var args = {
   path   : { "id_user": ID_USER },
   data   : { state: status },
   headers: { "Content-Type": "application/json" }
  };

  client.post(url, args, function (data, response) {
    //console.log("Berhasil Update Relay..");
  });
}

function updateStatusIgnition(url, status){
  var args = {
   path   : { "id_user": ID_USER },
   data   : { state: status },
   headers: { "Content-Type": "application/json" }
  };

  client.post(url, args, function (data, response) {
    console.log("Berhasil Update Relay Ignition..");
  });
}


function createLogActivity(url,title,message){
  var args = {
    path   : { "id_user": ID_USER },
    data   : { title: title, detail: message },
    headers: { "Content-Type": "application/json" }
  };

  client.post(url, args, function (data, response) {
    //console.log(response);
    //console.log("Berhasil "+message);
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
    //console.log(response);
    console.log("Notifikasi berhasil dikirim.. \n pesan =>"+message);
  });
}



function getStateRelay(url,id_user){
  var args = {
    path   : { "id_user": id_user},
    headers: { "Content-Type": "application/json" }
  };

  client.get(url, args, function (data, response) {
    console.log("state relay data ",data);

    if(data.buzzer){
     RELAY1.writeSync(1);
    }else{
     RELAY1.writeSync(0);
    }

    if(data.ignition_off){
     RELAY2.writeSync(1);
    }else{
     RELAY2.writeSync(0);
    }

    if(data.ignition_on){
     RELAY3.writeSync(1);
    }else{
     RELAY3.writeSync(0);
    }

     RELAY4.writeSync(0);

    if(data.realtime_gps){
     sc.emit('activate_python_gps', {msg:true});
    }else{
     sc.emit('activate_python_gps', {msg:false});
    }

  });
}
