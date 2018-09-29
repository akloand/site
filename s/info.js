function getInfo(initialInfo){
	var rate = fetch("https://api.coinmarketcap.com/v1/ticker/ethereum/")
		.then(function(response){
			return response.json();
		});

	if(!initialInfo)
		initialInfo = {sum: 0, timesum: 0, num: 0, investors: {}, dates: [], nums: [], sums: [], min: -1, max: 0};

	var jsonInternalPromise = fetch("https://api.etherscan.io/api?module=account&action=txlistinternal&address=0x7B307C1F0039f5D38770E15f8043b3dD26da5E8f&startblock=" + ((initialInfo.lastBlock || 0) + 1) + "&endblock=99999999&sort=asc&apikey=YourApiKeyToken")
		.then(function(response){
			return response.json();
		});

	return fetch("https://api.etherscan.io/api?module=account&action=txlist&address=0x7B307C1F0039f5D38770E15f8043b3dD26da5E8f&startblock=" + ((initialInfo.lastBlock || 0) + 1) + "&endblock=99999999&sort=asc&apikey=YourApiKeyToken")
		.then(function(response){
			return response.json();
		}).then(function(json){
			var info = json.result.reduce(function(info, tr){
				var val = +tr.value;
				if(!info.firstBlock){
					info.firstBlock = +tr.blockNumber;
					info.firstTime = +tr.timeStamp;
				}
				info.lastBlock = +tr.blockNumber;
				info.lastTime = +tr.timeStamp;

				if(info.investors[tr.from]){
					info.investors[tr.from].gas += tr.gasUsed * tr.gasPrice;
				}else{
					info.investors[tr.from] = {
						sum: 0,
						inv: [],
						gas: tr.gasUsed * tr.gasPrice
					}
				}

				if(+tr.isError)
					return info;
				
				if(val){
					info.last = val;
					info.last_time = tr.timeStamp * 1000;
			
					info.sum += val;
					info.timesum += val*tr.blockNumber;

					var inv = info.investors[tr.from];
					if(!inv.sum)
						info.num += 1;

					inv.sum += val;
					inv.inv.push({
						sum: val,
						time: info.last_time
					});

					var investment = info.investors[tr.from].sum;
					
					info.dates.push(info.last_time);
					info.nums.push(info.num);
					info.sums.push(Math.round(info.sum/Math.pow(10,16))/100);
			
					if(info.min == -1 || info.min > investment)
						info.min = investment;
					if(investment > info.max)
						info.max = investment;
				}
				return info;
			}, initialInfo);

			info.avg = info.sum/info.num;

			return rate.then(function(ratejson){
				info.rate = +ratejson[0].price_usd;
				info.sum_usd = info.sum/Math.pow(10, 18) * info.rate;

				jsonInternalPromise.then(function(json){
					info = json.result.reduce(function(info, tr){
						if(!(+tr.isError)){
							var inv = info.investors[tr.to];
							if(inv){
								inv.got = (inv.got || 0) + (+tr.value);
								inv.gotTime = tr.timeStamp*1000;
							}
						    info.got = (info.got || 0) + (+tr.value);
						}
						return info;
					}, info);
				}, function(e){
					console.log('Error fetching internal transactions: ' + e);
					return info;
				});

				return info;
			});

		});
}

function drawChart(info){
    if (document.getElementById('chart-container2')) {
    	var avg = (Math.round(info.avg/Math.pow(10,16))/100);
    	var min = (Math.ceil(info.min/Math.pow(10,16))/100);
    	var max = (Math.round(info.max/Math.pow(10,16))/100);
        Highcharts.chart('chart-container2', {
            /*tooltip: {
              /*  formatter: function () {
    
                    if (this.series.name == 'AVG') {
                        return '<b>' + this.key + '</b><br/>';
                    } else {
                        return '<b>' + this.series.name + '</b><br/>' +
                            new Date(this.x) + ': ' + this.y;
                    }
                }
            }, */
            title: {
                text: 'Combination chart',
                style: {
                	color: (Highcharts.theme && Highcharts.theme.textColor) || 'white'
                }
            },
            xAxis: {
                type: 'datetime',
                dateTimeLabelFormats: { // don't display the dummy year
    				day: '%e %b',
    				week: '%e %b',
                    month: '%e %b',
                    year: '%e %b'
                },
                title: {
                    enabled: false
                }
            },
            labels: {
                items: [{
                    html: 'Average ' + avg + 'ETH, max ' + max + ' ETH',
                    style: {
                        left: '50px',
                        top: '18px',
                        color: (Highcharts.theme && Highcharts.theme.textColor) || 'white'
                    }
                }]
            },
            legend: {
                itemStyle: {
                    color: '#A0A0A0'
                },
                itemHoverStyle: {
                    color: '#FFF'
                },
                itemHiddenStyle: {
                    color: '#444'
                }
            },
            yAxis: [{
                labels: {
                    enabled: true
                },
                title: {
                    enabled: false
                },
                minorGridLineWidth: 0.2,
                gridLineWidth: 0.1,
                alternateGridColor: null,
            }],
    
            plotOptions: {
                column: {},
                spline: {
                    dashStyle: 'Dot',
                    marker: {enabled: false},
                    states: {hover: {enabled: true}},
                },
                area: {
                    marker: {enabled: false},
                    states: {hover: {enabled: true}},
                    style: 'dotted',
                    fillOpacity: 0.2,
                },
                pie: {}
    
            },
    
            series: [
            	{ //Line
                    type: 'area',
                    name: 'ETH',
    
                    data: info.sums.map(function(e, i) { return [info.dates[i], e] }),
                    marker: {
                        lineWidth: 2,
                        lineColor: Highcharts.getOptions().colors[3],
                        fillColor: 'white'
                    },
                    enableMouseTracking: true,
    
                    color: '#ee06a4',
                    shadow: {
                        color: '#ee06a4',
                        width: 3,
                        offsetX: 0,
                        offsetY: 0
                    }
                }, { // Line 2
                    type: 'spline',
                    name: 'Users',
                    data: info.nums.map(function(e, i) { return [info.dates[i], e] }),
                    color: '#78ee06',
                    enableMouseTracking: true,
                    shadow: {
                        color: '#78ee06',
                        width: 3,
                        offsetX: 0,
                        offsetY: 0
                    },
                    formatter: function () {
                        return this.value;
                    }
                },
                {
                    type: 'pie',
                    name: 'Investment',
                    data: [
                        {
                            name: avg + ' AVG',
                            sliced: true,
                            selected: true,
                            y: avg,
                            color: 'rgba(150,100,50,0.1)' // AVG color
                        }, {
                            name: min + ' MIN',
                            y: min,
                            color: 'rgba(200,122,200,0.7)' // Joe's color
                        },
                        {
                            name: max + ' MAX',
                            y: max,
                            color: 'rgba(200,122,200,1)' // John's color
                        },
                    ],
                    center: [100, 80],
                    size: 100,
                    showInLegend: false,
                    dataLabels: {
                        enabled: false
                    }
                }]
        });
    }

}

function findAddress(address){
	var addr = address.toLowerCase();
	if(!window.investmentInfo)
		return null;

    if(investmentInfo.investors[addr])
    	return addr;

    for(var key in investmentInfo.investors){
    	if(key.indexOf(addr) === 0)
    		return key;
    }

    return null;
}

function updateDividentsTimer(investmentInfo){
	if(window.g_dividentsTimer){
		window.clearInterval(window.g_dividentsTimer);
		window.g_dividentsTimer = 0;
	}

	if(investmentInfo){
        updateDividents(investmentInfo, 'Now');
        updateDividents(investmentInfo, 'Month');
        
		window.g_dividentsTimer = window.setInterval(function(){
			updateDividents(investmentInfo, 'Now');
		}, 1000);
	}else{
		setCalcValues('?', 'Month', '?', '?', '?');
		setCalcValues('?', 'Now', '?', '?', '?');
	}
}

function updateDividents(investmentInfo, type){
	var curTime = +new Date();
	if(type !== 'Month'){
		var divs = 0;
		var sum = 0;
		for(var i=0; i<investmentInfo.inv.length; ++i){
			var inv = investmentInfo.inv[i];
			sum += inv.sum;
			divs += inv.sum * (curTime - Math.max(inv.time, investmentInfo.gotTime || 0));
		}
	    
		divs *= 0.04 / 86400000;
	}else{
		divs = investmentInfo.sum * 1.2;
	}

	divs /= Math.pow(10, 18);

	if(type !== 'Month'){
		divs = divs.toFixed(8);
	}else{
		divs = Math.round(divs*10000)/10000;
	}

	var got = ((investmentInfo.got || 0)/Math.pow(10,18)).toFixed(8);
	var gas = ((investmentInfo.gas || 0)/Math.pow(10,18)).toFixed(8);

	sum = (sum/Math.pow(10, 18)).toFixed(8).replace(/(\.[^0]*)0+$/, '$1');
	setCalcValues(divs, type, sum, got, gas);
}

function calcInvestment(resetTime){
	if(!updateDividentsTimer.startTime)
		updateDividentsTimer.startTime = +new Date();

	var inp = document.getElementById('inputInvestments');
	var text = inp.value.trim().replace(/,/g, '.');
	if(/^0x[\da-f]*$/i.test(text)){
		//Address
		var addr = findAddress(text);
		var info;;
	    if(addr){
	    	info = window.investmentInfo.investors[addr];
	    	localStorage.setItem('address', addr);
			if(text.length < addr.length){
				inp.value = addr;
				createSelection(inp, text.length, addr.length);
			}
		}
		updateDividentsTimer(info);
	}else if(/^\d+(\.\d*)?$/.test(text)){
		//Sum
		var sum = +text * Math.pow(10, 18);
		var investmentInfo = {
			sum: sum,
			inv: [{
				sum: sum,
				time: resetTime ? +new Date() : updateDividentsTimer.startTime
			}] 
		};

		updateDividentsTimer(investmentInfo);
	}else{
		updateDividentsTimer(null);
	}
	
	
}

function setCalcValues(div, type, inv, got, gas){
	if(typeof(inv) !== 'undefined'){
		document.getElementById('calcInvestmentValue').innerHTML = inv;
		document.getElementById('calcDividendsOut').innerHTML = got;
		document.getElementById('calcSpentOnGas').innerHTML = gas;
	}
	document.getElementById('calcDividends' + type).innerHTML = div;
}

function createSelection(field, start, end) {
    if( field.createTextRange ) {
        var selRange = field.createTextRange();
        selRange.collapse(true);
        selRange.moveStart('character', start);
        selRange.moveEnd('character', end);
        selRange.select();
    } else if( field.setSelectionRange ) {
        field.setSelectionRange(start, end);
    } else if( field.selectionStart ) {
        field.selectionStart = start;
        field.selectionEnd = end;
    }
    field.focus();
}       
