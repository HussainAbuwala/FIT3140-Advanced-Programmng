const functions = require('firebase-functions');
var nodemailer = require('nodemailer');
// The Firebase Admin SDK to access the Firebase Realtime Database.
const admin = require('firebase-admin');
var serviceAccount = require("./serviceAccountKey.json");
// Initialize the app with a service account, granting admin privileges
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://fir-proj-1e484.firebaseio.com/"  // IMPORTANT: repalce the url with yours 
});


var t1 = 1;
var t2 = 5;
var motion_start_time;
var motion_end_time;
var check = false;


/**
   description: sends email to a predefined address if length of the message is within a predefined range
   return: none
**/




exports.sMail = functions.database.ref('/motionSensorData').onWrite((change, context) => {
  const original = change.after.val();
  let allItem = Object.keys(original).map(data => [data, original[data]]);
  
  if (allItem.length !== 0){
    var newItem = allItem[allItem.length - 1][1];
    if (newItem.length > t1 && newItem.length < t2) {
        var html = "<h2> Motion Information </h2>";
        html += "<h3> Motion Type: </h3><span>" + newItem.typeOfMessage + "</span>";
        html += "<h3> Motion Length: </h3><span>" + newItem.length + "</span>";
        html += "<h3> Motion Start Time: </h3><span>" + newItem.start_time + "</span>";
        html += "<h3> Motion End Time: </h3><span>" + newItem.end_time + "</span>";
        
        sendMail(getMailObject("hsabu1@student.monash.edu",html))     
    }
  }
});



/**
   description: sends a summary of the last 5 motion sensor messages
   return: none
**/



exports.SSM = functions.database.ref('/motionSensorData').onWrite((change, context) => {
  const original = change.after.val();
  let allItem = Object.keys(original).map(data => [data, original[data]]);
  
  if (allItem.length !== 0 && allItem.length >= 5){
      var cnt = allItem.length - 1;
      var i = 0;
      var table = "<table border='4'><tr><th>Motion Number</th><th>Motion Type</th><th>Motion Length</th><th>Motion Start Time</th><th>Motion End Time</th></tr>"
      while (i < 5) {
          var item = allItem[cnt][1];
          
          table += "<tr><td>";
          table += i + 1;
          table += "</td>";
          
          table += "<td>";
          table += item.typeOfMessage;
          table += "</td>";
          
          table += "<td>";
          table += item.length;
          table += "</td>";
          
          table += "<td>";
          table += item.start_time;
          table += "</td>";
          
          table += "<td>";
          table += item.end_time;
          table += "</td>";
          
          table += "</tr>"
          cnt--;
          i++;
      }
      table += "</table>";
      sendMail(getMailObject("hsabu1@student.monash.edu",table));
  }
});



/**
   description: resets the database if the length of the message is greater than a threshold
   return: promise
**/



exports.rd = functions.database.ref('/motionSensorData').onWrite((change, context) => {
  const original = change.after.val();
  let allItem = Object.keys(original).map(data => [data, original[data]]);
  
  if (allItem.length !== 0){
    var newItem = allItem[allItem.length - 1][1];
    if (newItem.length > t2) {
        return admin.database().ref('/motionSensorData').set(null);
    }
  }
});




/**
   description: a object which consists of the senders email and which email service we are using
   return: none
**/



var transporter = nodemailer.createTransport({
  service: 'gmail',
  secure: false,
  port: 25,
  auth: {
    user: 'mozziebond@gmail.com',
    pass: 'marebaap'
  },
  tls: {
    rejectUnauthorized: false
  }
});

/**
   description: creates an mail object which consist of senders and recievers mail and the contents of the message
   param: roomNo
   param: user
   return: none
**/


function getMailObject(recieverEmail,str) {
    var mailOptions = {
          from: 'mozziebond@gmail.com',
          to: recieverEmail,
          subject: 'Sending Email using Node.js',
          html: str
        };
    return mailOptions;
}



/**
   description: sends the mail
   param: mailOptions
   return: none
**/

function sendMail(mailOptions) {
    transporter.sendMail(mailOptions, function(error, info){
        if (error) {
          console.log(error);
        } else {
          console.log('Email sent: ' + info.response);
        }
    });
}

