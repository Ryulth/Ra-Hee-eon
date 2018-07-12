/**
 * http://usejsdoc.org/
 */

module.exports.forecast = function(lat, lon, callback) {
	var request = require("request");
	var forecast_options = {// 단기예보
		url : 'http://apis.skplanetx.com/weather/forecast/3days?version=1&lat='
				+ lat + '&lon=' + lon,
		headers : {
			'x-skpop-userId' : 'xx',
			'Accept' : 'application/json',
			'Accept-Language' : 'ko_KR',
			'appKey' : '24c36e83-cbeb-3bfe-ba3e-b4b5ee058854'
		}
	}

	// 내일
	// 모레
	// 현재기온, 최고기온, 최저기온, 하늘상태, 강수확률
	request(
			forecast_options,
			function fetch_callback(error, response, body) {
				console.log(response.statusCode)
				if (!error && response.statusCode == 200) {
					var forecast_info = JSON.parse(body);

					var percent = forecast_info.weather.forecast3days[0].fcst3hour.precipitation;
					var sky = forecast_info.weather.forecast3days[0].fcst3hour.sky;
					var temper = forecast_info.weather.forecast3days[0].fcstdaily.temperature;
					var info = {
						"sky" : sky,
						"temper" : temper,
						"percent" : percent
					};

					callback(info);
				}

			});

}

module.exports.weather = function(lat, lon, callback) {
	var request = require("request");
	var weather_options = { // 현재날씨(분별)
		url : 'http://apis.skplanetx.com/weather/current/minutely?version=1&lat='
				+ lat + '&lon=' + lon,
		headers : {
			'x-skpop-userId' : 'xx',
			'Accept' : 'application/json',
			'Accept-Language' : 'ko_KR',
			'appKey' : '24c36e83-cbeb-3bfe-ba3e-b4b5ee058854'
		}
	};

	// 현재기온, 최고기온, 최저기온, 하늘상태, 강수확률
	request(weather_options, function fetch_callback(error, response, body) {
		console.log(response.statusCode);
		if (!error && response.statusCode == 200) {
			var weather_info = JSON.parse(body);
			var humidity = weather_info.weather.minutely[0].humidity;
			var sky = weather_info.weather.minutely[0].sky;

			var temper = weather_info.weather.minutely[0].temperature;
			var info = {
				"temper" : temper,
				"sky" : sky,
				"humidity" : humidity
			};

			callback(info);
		}

	});
};

module.exports.life = function(lat, lon, callback) {
	var request = require("request");
	var dust_options = {// 생활지수-미세먼지
		url : 'http://apis.skplanetx.com/weather/dust?lon='+lon+'&stnid=&lat='+lat+'&version=1',
		headers : {
			'x-skpop-userId' : 'xx',
			'Accept' : 'application/json',
			'Accept-Language' : 'ko_KR',
			'appKey' : '8f1f589a-f89d-3fd6-82f4-bc9d247d321f'
		}
	}
	var uv_options = {// 생활지수-자외선지수
		url : 'http://apis.skplanetx.com/weather/windex/uvindex?lon='+lon+'&stnid=&lat='+lat+'&version=1',
		headers : {
			'x-skpop-userId' : 'xx',
			'Accept' : 'application/json',
			'Accept-Language' : 'ko_KR',
			'appKey' : '8f1f589a-f89d-3fd6-82f4-bc9d247d321f'
		}
	}
	var laundry_options = {// 생활지수-빨래지수
		url : 'http://apis.skplanetx.com/weather/windex/laundry?lon='+lon+'&stnid=&lat='+lat+'&version=1',
		headers : {
			'x-skpop-userId' : 'xx',
			'Accept' : 'application/json',
			'Accept-Language' : 'ko_KR',
			'appKey' : '8f1f589a-f89d-3fd6-82f4-bc9d247d321f'
		}
	}
	//
	var th_options = {// 생활지수-불쾌지수
			url : 'http://apis.skplanetx.com/weather/windex/thindex?lon='+lon+'&stnid=&lat='+lat+'&version=1',
			headers : {
				'x-skpop-userId' : 'xx',
				'Accept' : 'application/json',
				'Accept-Language' : 'ko_KR',
				'appKey' : '8f1f589a-f89d-3fd6-82f4-bc9d247d321f'
			}
		}
	request(th_options,	function fetch_callback(error, response, body) {
		console.log(response.statusCode)
		if (!error && response.statusCode == 200) {
			var th_info = JSON.parse(body);
			request(uv_options,	function fetch_callback(error, response, body) {
				console.log(response.statusCode)
				if (!error && response.statusCode == 200) {
					var uv_info = JSON.parse(body);// 자외선지수

					request(dust_options,function fetch_callback(error, response, body) {
					console.log(response.statusCode)
					if (!error && response.statusCode == 200) {

						var dust_info = JSON.parse(body);// 미세먼지
						request(laundry_options,function fetch_callback(error,response, body) {
							console	.log(response.statusCode)
							if (!error&& response.statusCode == 200) {

								var laundry_info = JSON.parse(body);// 빨래지수

								var th = th_info.weather.wIndex.thIndex[0].current.index;
								var dust = dust_info.weather.dust;
								var value = dust[0].pm10.value;
								var grade = dust[0].pm10.grade;
								var laundry = laundry_info.weather.wIndex.laundry[0].day01;
								var uv = uv_info.weather.wIndex.uvindex[0].day01;
								var life_info = {
									"value" : value,
									"grade" : grade,
									"laundry" : laundry,
									"uv" : uv,
									"th" : th
								};//미세먼지 농도, 등급, 빨래지수, 자외선지수
								callback(life_info);
								}
							});
						}
					});
				}
			});
		}
	});
}
