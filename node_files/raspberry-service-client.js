var io = require('socket.io-client');
var sc = io.connect('https://rmvts.jagopesan.com/');
//var sc = io.connect('https://rmvts.herokuapp.com/');
//var sc = io.connect('http://192.168.8.100:3000/');
var exec = require('child_process').exec;
var gpio = require('onoff').Gpio;
var Client = require('node-rest-client').Client;
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
const RELAY_IGNITION = BASE_URL+"api/update-relay/ignition/${id_user}";
const RELAY_VIBRATION= BASE_URL+"api/update-relay/vibration/${id_user}";
const RELAY_BUZZER   = BASE_URL+"api/update-relay/buzzer/${id_user}";
const UPDATE_IGNITION= BASE_URL+"api/update-status-ignition/${id_user}";
const BASE_RELAY_STATE = BASE_URL+"api/get-relay-state/${id_user}";
//settup capture image
const LOKASI_FOTO      = "/home/pi/FILE_FOTO/";
const BASE_UPLOAD_FOTO = BASE_URL+"api/images/upload";

//settup state relay from API
getStateRelay(BASE_RELAY_STATE,ID_USER);

ARUS.watch(function(err, value){
 if(err){
  console.log('Error while Watching Current Sensor..');
 }
 if(value == 1){
  console.log('Arus terdeteksi ');

  setTimeout(function(){
   sc.emit('statusgps', {msg:true});
  }, 5000);

  updateStatusIgnition(UPDATE_IGNITION,"Aktif");

 }else{
  console.log('tidak ada arus listrik ');
  sc.emit('statusgps', {msg:false});
 }
});

sc.on('relay1', (data) => {
 if(data.msg){
  console.log('relay1 aktif : ', data.msg);
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
  console.log('relay1 aktif : ', data.msg);
  updateRelay(RELAY_BUZZER,false);
  createLogActivity(BASE_BUZZER,"Buzzer Notification", "Your Buzzer Turned Off");

  //menonaktifkan alarm
  exec('sudo systemctl stop buzzer.service', (err, stout, sterr) => {
   if(err !== null){
    console.log('exec error: ', err);
   }
  });
 }
});

sc.on('relay2', (data) =>{
 var i=0;
 if(data.msg){
  RELAY2.writeSync(1);
  console.log('relay2 aktif : ', data.msg);
  updateRelay(RELAY_VIBRATION,true);

  VIBRATION.watch(function (err, value){
   if(value == 1){
    i++;
   }
   console.log('ada getaran gaes',i);

   if(i%100 == 0){
   // createLogActivity(BASE_VIBRATION,"Vibration Notification", "Vibration detected on your vehicle");
    sc.emit('relay1', {msg:true});
   }
   // default 1 menit alarm mati
   setTimeout(function(){
    sc.emit('relay1', {msg:false});
   },60000);

  });
 }else{
  RELAY2.writeSync(0);
  console.log('relay2 aktif : ', data.msg);
  updateRelay(RELAY_VIBRATION,false);
 }

});

sc.on('relay3', (data) =>{
 if(data.msg){
  RELAY3.writeSync(0);
  console.log('relay3 aktif : ', data.msg);
  updateRelay(RELAY_IGNITION,true);
  createLogActivity(BASE_IGNITION,"Ignition Notification", "Ignition state are OFF");
 }else{
  RELAY3.writeSync(1);
  console.log('relay3 aktif : ', data.msg);
  updateRelay(RELAY_IGNITION,false);
  createLogActivity(BASE_IGNITION,"Ignition Notification", "Ignition state are ON");
 }
});

sc.on('relay4', (data) =>{
 if(data.msg){
  RELAY4.writeSync(1);
  console.log('relay4 aktif : ', data.msg);
  //updateRelay(RELAY_IGNITION,true);
 }else{
  RELAY4.writeSync(0);
  console.log('relay4 aktif : ', data.msg);
  //updateRelay(RELAY_IGNITION,false);
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

sc.on('statusgps', (data) => {
 if(data.msg){
  console.log('menjalankan GPS');
  updateRelay(RELAY_GPS,true);
  exec('sudo systemctl start gps-python.service', (err, stout, sterr) => {
  // console.log('stout: ', stout);
  // console.log('sterr: ', sterr);
   if(err !== null){
    console.log('exec error: ', err);
    updateRelay(RELAY_GPS,false);
   }
  });
 }
 else{
  console.log('menghentikan GPS');
  updateRelay(RELAY_GPS,false);
  exec('sudo systemctl stop gps-python.service', (err, stout, sterr) => {
  // console.log('stout: ', stout);
  // console.log('sterr: ', sterr);
   if(err !== null){
    console.log('exec error: ', err);
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
    console.log("Berhasil Update Relay..");
  });
}

function updateStatusIgnition(url, status){
  var args = {
   path   : { "id_user": ID_USER },
   data   : { state: status },
   headers: { "Content-Type": "application/json" }
  };

  client.post(url, args, function (data, response) {
    console.log("Berhasil Update Relay..");
  });
}


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
}



function getStateRelay(url,id_user){
  var args = {
    path   : { "id_user": id_user},
    headers: { "Content-Type": "application/json" }
  };

  client.get(url, args, function (data, response) {
    console.log("state relay data ",data);
    if(data.ignition){
     RELAY3.writeSync(1);
    }else{
     RELAY3.writeSync(0);
    }

    if(data.buzzer){
     RELAY1.writeSync(0);
    }else{
     RELAY1.writeSync(1);
    }

    if(data.vibration){
     RELAY2.writeSync(0);
    }else{
     RELAY2.writeSync(1);
    }

     RELAY4.writeSync(0);

  });
}
