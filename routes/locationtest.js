/**
 * http://usejsdoc.org/
 */
var request = require("request");
module.exports.location = function(name,callback)
{
	var fetch_options = {
	    url: encodeURI('https://maps.googleapis.com/maps/api/geocode/json?address='+name+'&key=AIzaSyDL3D3E1M8DAEZ1zMdkFP8d4u2LU1BgSwE'),
	    headers: {
	       
	      
	    }
	}
	function fetch_callback(error, response, body) {
		console.log(response.statusCode)
		var info = JSON.parse(body);
		if (info.status=='ZERO_RESULTS')
			{
			callback(0);
			}
		else if (!error && response.statusCode == 200) { 
	        
	        console.log(info);
	        console.log(info.results[0].formatted_address);
	        console.log(info.results[0].geometry.location);
	        callback(info.results[0].geometry.location);
	    }
	    
	}
	request(fetch_options, fetch_callback);
}
//

