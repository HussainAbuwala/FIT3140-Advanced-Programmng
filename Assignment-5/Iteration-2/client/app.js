var socket = io('http://localhost:3000');
var uploader = new SocketIOFileClient(socket);
var form = document.getElementById('form');


//file ready to go
uploader.on('ready', function() {
	console.log('SocketIOFile ready to go!');
});

//File loading in progress
uploader.on('loadstart', function() {
	console.log('Loading file to browser before sending...');
});

//upload in progress
uploader.on('progress', function(progress) {
	console.log('Loaded ' + progress.loaded + ' / ' + progress.total);
});

//upload started
uploader.on('start', function(fileInfo) {
	console.log('Start uploading', fileInfo);
});

//streaming
uploader.on('stream', function(fileInfo) {
	console.log('Streaming... sent ' + fileInfo.sent + ' bytes.');
});

//upload complete, update client
uploader.on('complete', function(fileInfo) {
	console.log('Upload Complete', fileInfo);
	
	$('#inputImg').html("");
	$('#message').html("");
	$('#myCanvas').html("");
	$('#info').html("");
	$('#sound').html("");
	
	$('#inputImg').prepend('<img id="theImg" src="' + fileInfo.name + '"/>')
	$("#message").html("Upload Successful");
	$("#message").css("background-color","lime");
	$("#message").css("color","black");
});
uploader.on('error', function(err) {
	console.log('Error!', err);
});
uploader.on('abort', function(fileInfo) {
	console.log('Aborted: ', fileInfo);
});

//face information received from server. Show information to client
socket.on('done',function (data) {
	
	var img = document.getElementById('theImg'); 
//or however you get a handle to the IMG
	var width = img.clientWidth;
	var height = img.clientHeight;
	
	var c = document.getElementById("myCanvas");
    var ctx = c.getContext("2d");
	ctx.canvas.width  = width;
	ctx.canvas.height = height;
    var img = document.getElementById("theImg");
    ctx.drawImage(img,0,0);
	
	var locations = data.location;
	var totalFaces = data.total;
	var avgAges = data.ages;
	var genders = data.gender;
	
	console.log("Start of updating face Information on client side")
	
	$('#sound').html("<button id = 'btn'>Download Audio File</button>")
	$('#btn').click(function(){
		window.open('/download');
	})
	
	$('#info').append("<tr><th>Face Number </th><th>Average Age </th><th> Gender</th></tr>");
	for (var i = 0; i < totalFaces; i++) {
		var faceNo = i + 1;
		
		var ctx = c.getContext("2d");
		ctx.lineWidth="3";
		ctx.strokeStyle="red";
		ctx.rect(locations[i][0], locations[i][1], locations[i][2], locations[i][3]);
		ctx.font = "50px Georgia";
		ctx.fillStyle="#FFFF00";
		var x = (locations[i][0] + (locations[i][0] + locations[i][2])) / 2;
		var y = (locations[i][1] + (locations[i][1] + locations[i][3])) / 2;
		ctx.fillText(faceNo,x,y);
		ctx.setLineDash([6])
		ctx.stroke();
		
        $('#info').append('<tr><td>' + faceNo + '</td><td>' + avgAges[i] +
						  '</td><td>' + genders[i] + '</td></tr>')
    }
	//$("#sound").html("<source src='mama.mp3' type='audio/mpeg'>")
	console.log("End of updating face Information on client side")
})

function loadImage(path, width, height, target) {
    $('<img src="'+ path +'">').load(function() {
      $(this).width(width).height(height).appendTo(target);
    });
}


//on submit send file to uploader who will upload to server
form.onsubmit = function(ev) {
	ev.preventDefault();
	
	// Send File Element to upload
	var fileEl = document.getElementById('file');
	// var uploadIds = uploader.upload(fileEl);

	// Or just pass file objects directly
	var uploadIds = uploader.upload(fileEl.files);
};