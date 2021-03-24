var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);



//var b = require('bonescript');
//b.pinMode('P8_13', b.OUTPUT);

/**
	description: reads the state of the P8_13 pin and calls the function khela with the state of the P8_13 PIN.
	param: none
	return: none
	
**/

function main() {
    b.digitalRead('P8_13', khela);

}

/**
	description: WRITES high value into the P8_13 pin and then sets an timer to off the pin after some time
	param: time
	return: none
	
**/


function LEDon(time){
    b.digitalWrite('P8_13', b.HIGH);
    setTimeout(LEDoff,time);
}

/**
	description: write low value to P8_13 pin
	param: none
	return: none
	
**/


function LEDoff(){
    b.digitalWrite('P8_13', b.LOW);
}


/**
	description: check if the state of the LED is already off, then turns on the LED for 20 seconds. Else if it is already on, then extends timer by 5 seconds.
	param: x
	return: none
	
**/

function khela(x){
     if( x.value === 0) {
         LEDon(20000)
     }
     else{
         x = setInterval(function () {
             b.digitalRead('P8_13', function (v) {
                 if (v.value === 0){
                     clearInterval(x);
                     b.digitalWrite('P8_13', b.HIGH);
                     LEDon(5000);
                 }
             });
         },10)
     }
}



/**
	required for the connections to the firebase
	
**/



var admin = require("firebase-admin");
// Fetch the service account key JSON file contents
var serviceAccount = require("./serviceAccountKey.json");
// Initialize the app with a service account, granting admin privileges
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://firstproject-2a52b.firebaseio.com/"  // IMPORTANT: repalce the url with yours 
});
// As an admin, the app has access to read and write all data, regardless of Security Rules
var db = admin.database();
var ref = db.ref("/motionSensorData"); // channel name


/**
 *
 *this is whenever the database gets a new record, it sends a snapshot to the server
 *
 */



ref.on("value", function(snapshot) {
   
}, function (errorObject) {             // if error
  console.log("The read failed: " + errorObject.code);
});



/**
	when the user accesses the root page, the server gives the index.html page
**/


app.get('/', function(req, res) {
   res.sendfile('index.html');
});

var id = 1;
var arr = [];


/**
	description: reads the current sequence of the array and checks if it matches "LSLL"
	param: arr
	return: true if it matches sequence else false
**/



function checkSeq(arr) {
    
    var seq = ["LONG","SHORT","LONG","LONG"]
    for (var i = 0; i < arr.length; i++) {
        if (arr[i] !== seq[i]) {
            arr.shift();
            return false
        }
    }
    return true;
    
}



/**
	description: sends update count event to client whenever a new message is received.
	param: data
	param: chk
	param: socket
	return: none
**/




function updateCount(data,chk,socket) {
    
    if (data.msg === "SHORT") {
        socket.emit("updateCount",["#cntS",parseInt(data.shrt) + 1])
    }
    else if (data.msg === "LONG") {
        socket.emit("updateCount",["#cntL",parseInt(data.lng) + 1])
    }
    if (chk === true) {
        socket.emit("updateCount",["#cntV",parseInt(data.vis) + 1])
    }

}

////////////////////////











var motion_data = [1,0,1,1,1,1,1,1,0,1,1,0,1,1,1,1,0,0,0,1,1,1,1,0]
var index = 0;
var sensorOff = false;
//var motion_data = [];
   
/*b.pinMode('P8_19', b.INPUT);
			setInterval(checkPIR, 1000); // Checks the Sensor Every second

			function checkPIR(){
			b.digitalRead('P8_19', printStatus);
			}

			function printStatus(x) {
				if (sensorOff === false) {
					if(x.value === 0){
						motion_data.push(1);
					}
					else{
						motion_data.push(0);
						var result = process(len(motion_data) - 2)
						if (result !== false) {
							socket.emit("giveCount",result);
						}
					}
				}
			}
			*/
   
   
/**
	description: process sequence of detections to find if it is short, long or none
	param: v
	return: false if the sequence is not long or short.
	
**/


   
function process(v) {
    
    x = []
    while (v >=0 && motion_data[v] === 1) {
        x.push(1)
        v--;
    }
    if (x.length >=1 && x.length < 3) {
        return ["SHORT",x.length]
    }
    else if (x.length > 3) {
        return ["LONG",x.length]
    }
    else{
        return false;
    }
    
    
}

/**
	description: turns off the sensor if it is on and vice versa
	param: none
	return: none
**/

            
function sensorChange() {
    if (sensorOff === false) {
        sensorOff = true;
    }
    else {
        sensorOff = false;
    }
}


io.on('connection', function(socket) {
        
    
    /*Whenever a new message is received from the sensor, update count of user and add to the database,*/
    
    socket.on("newMsg" , function (data) {
      
      arr.push(data.msg)
      console.log(arr);
      if (arr.length === 4) {
        var chk = checkSeq(arr);
        if (chk === true) {
            arr = [];
            //main()
        }
      }
      
      updateCount(data,chk,socket)
      ref.child(id).set({typeOfMessage: data.msg, length: data.len, dateTime: new Date().toLocaleString()});
      id++;
   
   })
    
    /*Reset the database*/
    
    socket.on("resetDatabase",function (data) {
        ref.set(null);
    })
    
    
    /*Mimic the sensor by looping through the values every one second*/
    
    var pnt = setInterval(function () { 

        if (sensorOff === false) {

            
            if (motion_data[index] === 0) {
            console.log("glll");
            var result = process(index-1)
                if (result !== false) {
                    socket.emit("giveCount",result);
                }
            }
            
    }

        index++; 

        if (index == motion_data.length)
          clearInterval(pnt);
          
    }, 1000);

    
    /*
    socket.on("changeLED",function (data) {
        b.digitalRead('P8_13', function (x){  
                if (x.value === 0) {
                    b.digitalWrite('P8_13', b.HIGH);
                }
                else {
                    b.digitalWrite('P8_13', b.LOW);
                }
            });
        })
    */
    
    /*call sensor change function to change state of sensor when the user requests it*/
    
    socket.on("chngSensor",sensorChange);
    
      
      
})


/* Listen on port 3000 for the user*/

http.listen(3000, function() {
   console.log('listening on localhost:3000');
});

