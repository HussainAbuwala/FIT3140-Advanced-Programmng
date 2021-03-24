var app = require('express')();
var http = require('http').Server(app);
var admin = require("firebase-admin");
var serviceAccount = require("./serviceAccountKey.json");
var b = require('bonescript');







// Initialize the app with a service account, granting admin privileges
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://fir-proj-1e484.firebaseio.com/"
  //databaseURL: "https://firstproject-2a52b.firebaseio.com/"  // IMPORTANT: repalce the url with yours 
});
// As an admin, the app has access to read and write all data, regardless of Security Rules
var db = admin.database();
var ref = db.ref("/motionSensorData"); // channel name
//var motion_data = [1,0,0,1,1,0,1,1,1,1,0,0,0,1,1,1,1,0,1,1,1,1,1,1,0]
//var index = 0;



/**
   description: finds if a message is short or long
   param: v
   return: false if message is not short or long
**/

function process(v) {
    
    x = []
    while (v >=0 && motion_data[v] === 1) {
        x.push(1)
        v--;
    }
    if (x.length >0) {
        return ["General",x.length]
    }
    else{
        return false;
    }
}

var motion_start_time;
var motion_end_time;
var check = false;


/**
   description: mimics the sensor by sending data every second
   param: none
   return: none
**/

/*
var pnt = setInterval(function () { 
        
    if (motion_data[index] === 0) {
    var result = process(index-1)
        if (result !== false) {
            check = false;
            motion_end_time = new Date().toLocaleTimeString();;
            ref.push({typeOfMessage: result[0],
                              timeStamp: new Date().toLocaleString(),
                              start_time: motion_start_time,
                              end_time: motion_end_time,
                              length: result[1]
                                }
                              );
        }
    }
    
    if (check === false && motion_data[index] === 1) {
        motion_start_time = new Date().toLocaleTimeString();
        check = true;
    }
    
    index++; 

    if (index == motion_data.length)
      clearInterval(pnt);
      
}, 1000);

*/


var motion_data = [];
b.pinMode('P8_19', b.INPUT);
setInterval(checkPIR, 1000); // Checks the Sensor Every second

function checkPIR(){
	b.digitalRead('P8_19', printStatus);
}

function printStatus(x) {
    if(x.value === 0){
        motion_data.push(1);
    }
    else{
        motion_data.push(0);
        var result = process(motion_data.length - 2)
        if (result !== false) {
            check = false;
            motion_end_time = new Date().toLocaleTimeString();;
            ref.push({typeOfMessage: result[0],
                        timeStamp: new Date().toLocaleString(),
                        start_time: motion_start_time,
                        end_time: motion_end_time,
                        length: result[1]
            });
        }
    }
    if (check === false && x.value === 0) {
        motion_start_time = new Date().toLocaleTimeString();
        check = true;
    }
}

