"use strict";
const express = require('express');
const app = express();
const http = require('http');
const httpServer = http.Server(app);
const io = require('socket.io')(httpServer);
const SocketIOFile = require('socket.io-file');
var VisualRecognitionV3 = require('watson-developer-cloud/visual-recognition/v3');
var TextToSpeechV1 = require('watson-developer-cloud/text-to-speech/v1');
var fs = require('fs');

var visualRecognition = new VisualRecognitionV3({
  version: '2018-03-19',
  api_key: '8708c8a3d908d94c17effedef356cef70b8b335d'
});

var text_to_speech = new TextToSpeechV1 ({
  username: "2f81167f-3ff4-4e33-91c6-93be072ab348",
  password: "ohmUZZcymry1"
});



var winston  = require('winston');
const env    = process.env.NODE_ENV || 'development';
// if the env is not specified, then it is development
const logDir = 'log'; // to create a log folder // Create the log directory if it does not exist
if (!fs.existsSync(logDir)) { 
// if the folder is not exist
     fs.mkdirSync(logDir);     // create one
}

//Winston generates logs 0 to specified level
// for example: if winston level is info, we will get error, warn and info
//Winston Levels: { error: 0, warn: 1, info: 2, verbose: 3, debug: 4, silly: 5 }
const tsFormat = function () {  // get the current time
    return (new Date()).toLocaleTimeString();
};  



//Setting the format to be used for logging for logging to console and logging to a file

const logger = new (winston.Logger)({
	  transports: [
		   new (winston.transports.Console)({
				   timestamp: tsFormat, // print out the time
				   colorize : true,     // colorize the output
				   level    : env === 'development' ? 'debug' : 'info' //dynamic level
		   }),                         
		   new (winston.transports.File)({
				   filename : logDir + "/ results.log", // file name
				   timestamp: tsFormat, // print out the time
				   level    : env === 'development' ? 'debug' : 'info' //dynamic level
		   })                                
	   ]                                
});



//get html file and display to client

app.get('/', (req, res, next) => {
	return res.sendFile(__dirname + '/client/index.html');
});

app.get('/download', function(req, res){
          var file = __dirname + '/data/mama.wav';
          res.download(file); // Set disposition and send it.
});


//get the app.js file
app.get('/app.js', (req, res, next) => {
	return res.sendFile(__dirname + '/client/app.js');
});

app.get('/socket.io.js', (req, res, next) => {
	return res.sendFile(__dirname + '/node_modules/socket.io-client/dist/socket.io.js');
});

app.get('/socket.io-file-client.js', (req, res, next) => {
	return res.sendFile(__dirname + '/node_modules/socket.io-file-client/socket.io-file-client.js');
});

app.use(require('express').static('public'));
app.use(require('express').static('data'));

io.on('connection', (socket) => {
	logger.info('Socket connected.');

	var count = 0;
	var uploader = new SocketIOFile(socket, {
		// uploadDir: {			// multiple directories
		// 	music: 'data/music',
		// 	document: 'data/document'
		// },
		uploadDir: 'data',							// simple directory
		// accepts: ['audio/mpeg', 'audio/mp3'],		// chrome and some of browsers checking mp3 as 'audio/mp3', not 'audio/mpeg'
		// maxFileSize: 4194304, 						// 4 MB. default is undefined(no limit)
		chunkSize: 10240,							// default is 10240(1KB)
		transmissionDelay: 0,						// delay of each transmission, higher value saves more cpu resources, lower upload speed. default is 0(no delay)
		overwrite: false							// overwrite file if exists, default is true.
		// rename: function(filename) {
		// 	var split = filename.split('.');	// split filename by .(extension)
		// 	var fname = split[0];	// filename without extension
		// 	var ext = split[1];

		// 	return `${fname}_${count++}.${ext}`;
		// }
		
	});
    
	
	//Start uploading starts from here
	uploader.on('start', (fileInfo) => {
		logger.info('Start uploading');
		//console.log(fileInfo);
	});
	uploader.on('stream', (fileInfo) => {
		logger.info('Uploading in progress')
		//console.log(`${fileInfo.wrote} / ${fileInfo.size} byte(s)`);
	});
	
	//uploading finishes here
	uploader.on('complete', (fileInfo) => {
		logger.info('Upload Complete.');
		
		//send the client all the face information. Also create the audio file for text-to-audio		
		detectFaces('./data/' + fileInfo.name,function (info) {
		  
		  var totalFaces = getTotalFaces(info);
		  var avgAges = getAverageAges(info);
		  var genders = getGenders(info);
		  
		  
		  var msg = createMessage(totalFaces,avgAges,genders);
		  
		  var params = {
			  text: msg,
			  voice: 'en-US_AllisonVoice',
			  accept: 'audio/wav'
		  };
          
          fs.unlink('data/mama.wav', (err) => {
            //console.log('path/file.txt was deleted');
         });
		  
		  //convert text to audio and save it in a file
		  text_to_speech.synthesize(params).on('error', function(error) {
			console.log('Error:', error);	
		  }).pipe(fs.createWriteStream('data/mama.wav'));
		  
          
          var name = fileInfo.name +'.wav'
		  socket.emit("done",({total: totalFaces, ages: avgAges, gender: genders,fn: name}));
		
		});
		
	});
	uploader.on('error', (err) => {
		console.log('Error!', err);
	});
	uploader.on('abort', (fileInfo) => {
		console.log('Aborted: ', fileInfo);
	});
});


/*

  Description: creates the text for audio conversion
  Param: totalFaces - total number of faces
  Param: avgAges - average age of each face
  Param: genders - gender of each face
  Precondition: length of each input is same
  Postcondition: text consisting information of each face
  return: text


*/
function createMessage(totalFaces,avgAges,genders) {
    var msg = "There are Total " + totalFaces + " faces! ,";
	//var faceInfo = []
	logger.info('Start of createMessage function');
	logger.verbose('Loop Start');
	for (var i = 0; i < totalFaces; i++) {
		var faceNo = i + 1
		msg += "Face " + faceNo + " has an average age of " + avgAges[i] +  " and is a " + genders[i] + ",";
		logger.debug('Iteration' + i + ' text:- ' + msg);
	//	faceInfo.push([avgAges[i],genders[i]])
	}
	logger.verbose('Loop End');
	logger.info('End of createMessage function');
	
	return msg
}


/*

  Description: detects information about faces using AI and machine learning 
  Param: image - path where the image can be found
  Param: fn - function to pass on the face information to
  Precondition: image path must be valid
  Postcondition: faces information will be passed to other functions
  return: none


*/
function detectFaces(image,fn) {
	var VisualRecognitionV3 = require('watson-developer-cloud/visual-recognition/v3');
	var fs = require('fs');

	var visualRecognition = new VisualRecognitionV3({
	  version: '2018-03-19',
	  api_key: '8708c8a3d908d94c17effedef356cef70b8b335d'
	});

	var images_file = fs.createReadStream(image)

	var params = {
	  images_file: images_file
	};

	 visualRecognition.detectFaces(params, function(err, response) {
	  logger.info('Start of detectFaces function');
	  if (err)
	    console.log(err);
	  else
	    //console.log(JSON.stringify(response, null, 2))
		logger.debug('Face detection successful by Watson');
		logger.info('End of detectFaces function');
		fn(response);
	});
	 
}



/*

  Description: get the total number of faces from the image
  Param: faceInfo - information about faces
  Precondition: faceInfo should be valid
  Postcondition: total number of faces will be found out
  return: total number of faces


*/
function getTotalFaces(faceInfo) {
	logger.info('Start getTotalFaces Function');
	
    var totalF = faceInfo.images[0].faces.length;
	logger.debug('Total Faces: ' + totalF );
	
	logger.info('End of getTotalFaces Function');
	return totalF
}


/*

  Description: get the average age of each face
  Param: faceInfo - information about faces
  Precondition: information should be valid
  Postcondition: average age of each age is found
  return: average ages


*/
function getAverageAges(faceInfo) {
  
	logger.info('Start getAverageAges Function');
    var allfaces = faceInfo.images[0].faces
	var ages = []
	logger.verbose('Loop Start'); 
	for (var i = 0; i < allfaces.length; i++) {
		  var face = allfaces[i];
		  var minAge = face.age.min
		  var maxAge = face.age.max
		  var averageAge = (minAge + maxAge) / 2;
		  var faceNo = i + 1
		  ages.push(averageAge)
		  logger.debug('Iteration' + i + ' Face-' + faceNo + ' Average Age: ' + averageAge);
	}
	logger.verbose('Loop End');
	logger.info('End of getAverageAges Function');
	return ages;
}

/*

  Description: finds the gender of each face
  Param: faceInfo - information about faces
  Precondition: information should be valid
  Postcondition: gender of each face will be found
  return: genders


*/
function getGenders(faceInfo) {
	
	logger.info('Start getGenders Function');
    var allfaces = faceInfo.images[0].faces
	var genders = []
	logger.verbose('Loop Start'); 
	for (var i = 0; i < allfaces.length; i++) {
		  var face = allfaces[i];
		  var gender = face.gender.gender
		  var faceNo = i + 1
		  genders.push(gender)
		  logger.debug('Iteration' + i + ' Face-' + faceNo + ' Gender: ' + gender);
	}
	logger.verbose('Loop End');
	logger.info('End of getGenders Function');
	
	return genders;
}


httpServer.listen(3000, () => {
  
	logger.info('Server listening on port 3000');
});