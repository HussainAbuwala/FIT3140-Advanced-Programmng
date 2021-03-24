function Watson(image){
 	this._image = image;
}

Watson.prototype.getTotalFaces = function(fn) {

	if (typeof(this._image) !== 'string') {
		fn(false);
		return
	}
	detectFaces(this._image,function (faceInfo) {
		fn(faceInfo.images[0].faces.length)
	})
}

Watson.prototype.getAverageAges = function (fn) {

	detectFaces(this._image,function (faceInfo) {

		var allfaces = faceInfo.images[0].faces
		var ages = []
		for (var i = 0; i < allfaces.length; i++) {
			  var face = allfaces[i];
			  var minAge = face.age.min
			  var maxAge = face.age.max
			  var averageAge = (minAge + maxAge) / 2;
			  ages.push(averageAge)
		}
		fn(ages);

	})

}


function detectFaces(image,fn) {


	var VisualRecognitionV3 = require('watson-developer-cloud/visual-recognition/v3');
	var fs = require('fs');

	var visualRecognition = new VisualRecognitionV3({
	  version: '2018-03-19',
	  api_key: '8708c8a3d908d94c17effedef356cef70b8b335d'
	});

	var images_file = fs.createReadStream('./' + image)

	var params = {
	  images_file: images_file
	};

	 visualRecognition.detectFaces(params, function(err, response) {
	  if (err)
	    console.log(err);
	  else
	    //console.log(JSON.stringify(response, null, 2))
		//var x =  response.images[0].faces.length;
		fn(response);
	});
}

module.exports = Watson;