function getInfo(){
	var rate = window.fetch("https://api.coinmarketcap.com/v1/ticker/ethereum/")
		.then(function(response){
			return response.json();
		});

	return window.fetch("https://api.etherscan.io/api?module=account&action=txlist&address=0x7B307C1F0039f5D38770E15f8043b3dD26da5E8f&startblock=0&endblock=99999999&sort=desc&apikey=YourApiKeyToken")
		.then(function(response){
			return response.json();
		}).then(function(json){
			var info = json.result.reduce(function(info, tr){
				var val = +tr.value;
				if(val){
					if(!info.last){
						info.last = val;
						info.last_time = tr.timestamp * 1000;
					}
					info.sum += val;
					if(info.investors[tr.from]){
						info.investors[tr.from] += val;
					}else{
						info.investors[tr.from] = val;
						info.num += 1;
					}
				}
				return info;
			}, {sum: 0, num: 0, investors: {}});
			
			return rate.then(function(ratejson){
				info.rate = +ratejson[0].price_usd;
				info.sum_usd = info.sum/Math.pow(10, 18) * info.rate;
				return info;
			});
		});
}
