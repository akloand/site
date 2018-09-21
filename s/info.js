function getInfo(){
	var rate = window.fetch("https://api.coinmarketcap.com/v1/ticker/ethereum/")
		.then(function(response){
			return response.json();
		});

	return window.fetch("https://api.etherscan.io/api?module=account&action=txlist&address=0x7B307C1F0039f5D38770E15f8043b3dD26da5E8f&startblock=0&endblock=99999999&sort=asc&apikey=YourApiKeyToken")
		.then(function(response){
			return response.json();
		}).then(function(json){
			var info = json.result.reduce(function(info, tr){
				var val = +tr.value;
				if(val){
					info.last = val;
					info.last_time = tr.timeStamp * 1000;

					info.sum += val;
					if(info.investors[tr.from]){
						info.investors[tr.from] += val;
					}else{
						info.investors[tr.from] = val;
						info.num += 1;
					}
					
					info.dates.push(info.last_time);
					info.nums.push(info.num);
					info.sums.push(Math.round(info.sum/Math.pow(10,16))/100);

					if(info.min == -1 || info.min > val)
						info.min = val;
					if(val > info.max)
						info.max = val;
				}
				return info;
			}, {sum: 0, num: 0, investors: {}, dates: [], nums: [], sums: [], min: -1, max: 0});

			info.avg = info.sum/info.num;
			
			return rate.then(function(ratejson){
				info.rate = +ratejson[0].price_usd;
				info.sum_usd = info.sum/Math.pow(10, 18) * info.rate;
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
                    html: 'Avg. investment: ' + avg + 'ETH',
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
                    name: 'AVG',
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