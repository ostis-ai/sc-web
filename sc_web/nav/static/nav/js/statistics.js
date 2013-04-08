$.namespace('Nav.stat');

Nav.stat.Main = {

	fmt: 'dd-mm-yyyy',
	fromDatePicker: null,
	toDatePicker: null,
	    
    timeScale: 'day',

    data: [],

    memDataTable: null,
    elDataTable: null,
    serverDataTable: null,

    memOptions: null,
    serverOptions: null,
    elOptions: null,

    memChart: null,
    serverChart: null,
    elChart: null,

    init: function() {
    	this.build();
        this._registerMenuHandler();
		this.initialStatistics();
    },
	
	initialStatistics: function() {
		// show current month statistics by day scale on start
		var today = new Date();
		var firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
		this.fromDatePicker.setValue(firstDayOfMonth);
        this.toDatePicker.setValue(today);
		this.getStatistics(firstDayOfMonth, today);
	},

    build: function() {
        var self = Nav.stat.Main;
        self.initDataTables();
        self.initOptions();
        self.initCharts();
    },

    initDataTables: function() {
        this.memDataTable = new google.visualization.DataTable();
        this.memDataTable.addColumn('datetime', 'Time');
        this.memDataTable.addColumn('number', 'Nodes');
        this.memDataTable.addColumn('number', 'Arcs');
        this.memDataTable.addColumn('number', 'Links');
        this.memDataTable.addColumn('number', 'Deleted nodes');
        this.memDataTable.addColumn('number', 'Deleted arcs');
        this.memDataTable.addColumn('number', 'Deleted links');
        this.memDataTable.addColumn('number', 'Empty');

        this.elDataTable = new google.visualization.DataTable();
        this.elDataTable.addColumn('string', 'Sc-element Type');
        this.elDataTable.addColumn('number', 'Elements Percentage');

        this.serverDataTable = new google.visualization.DataTable();
        this.serverDataTable.addColumn('datetime', 'Time');
        this.serverDataTable.addColumn('number', 'Connections');
        this.serverDataTable.addColumn('number', 'Commands');
        this.serverDataTable.addColumn('number', 'Command errors');
    },

    initOptions: function() {
        this.memOptions = {
            title: 'sc-memory',
            isStacked: true,
            vAxis: {title: "Count"},
            hAxis: {
                title: "Date",
                format: 'd MMM y'
            },
            pointSize: 3
        };

        this.serverOptions = {
            title: 'sctp server',
            isStacked: true,
            vAxis: {title: "Count"},
            hAxis: {
                title: "Date",
                format: 'd MMM y'
            },
            pointSize: 3
        };

        this.elOptions = {
            title: 'sc-elements statistics',
            isStacked: true
        };
    },

    initCharts: function() {
        this.memChart = new google.visualization.LineChart(
        		document.getElementById('memory_usage'));
        this.serverChart = new google.visualization.LineChart(
        		document.getElementById('server_usage'));
        this.elChart = new google.visualization.PieChart(
        		document.getElementById('elements_pie'));
    },

    _registerMenuHandler: function() {
        this._registerDateRangeHandler();
        this._registerScaleHandler();
    },

    _registerDateRangeHandler: function() {
        this._registerDatePickers();
        this._registerGetDataHandler();
    },

    _registerGetDataHandler: function() {
        var self = this;
        $('#button_select_range').click(function () {
            if ($('#from').val() && $('#to').val()) {
                self.getStatistics(
					self.getFromDate(),
					self.getToDate()
				);
            } else {
                alert("Range is empty!");
            }
        });
    },

    _registerDatePickers: function() {
        self = this;
        var fromPicker = $('#from').datepicker({
            format: self.fmt,
            onRender:function (date) {
                return date.valueOf() > new Date().valueOf() ? 'disabled' : '';
            }
        }).on('changeDate', function (ev) {
            if (ev.date.valueOf() > toPicker.date.valueOf()) {
            	toPicker.setValue(new Date(ev.date));
            }
            fromPicker.hide();
            toPicker.update();
            $('#to').focus();
        }).data('datepicker');

        var toPicker = $('#to').datepicker({
            format: self.fmt,
            onRender:function (date) {
                return date.valueOf() < fromPicker.date.valueOf() ? 'disabled' : ''
            }
        }).on('changeDate',function (ev) {
    		toPicker.hide();
        }).data('datepicker');
		
		this.fromDatePicker = fromPicker;
		this.toDatePicker = toPicker;		

        // forbids input
        $('#from').keypress(function() {
            return false;
        });

        $('#to').keypress(function() {
            return false;
        });
    },

    _registerScaleHandler: function() {
        var self = this;
        $('#' + this.timeScale).button('toggle');
        $('div.btn-group button').click(function () {
            var scale = $(this).attr('id');
            self.setTimeScale(scale);
            if (self.data && self.data.length) {
                self.drawCharts();
            }
        });
    },

    setTimeScale: function(scale) {
        this.timeScale = scale;
    },
    
    getFromDate: function() {
        return this.fromDatePicker.date;
    },
    
    getToDate: function() {
        return this.toDatePicker.date;
    },
    
	/**
	 * Returns statistics data for the specified date range
	 * @param {int} fromValue begin of date range in ms
	 * @param {int} toValue end of date range in ms
	 * @param {Function} success Callback function, that recieves data.
	 * @param {Function} error Callback function, that calls on error
	 */
    _getStatisticsData: function(fromValue, toValue, success, error) {
        $.ajax({
            type: 'GET',
            url: '/stat/data',
            data:{
                from : fromValue,
                to : toValue
            },
            success: success,
            error: error,
        });
    },
	
	setHeader: function(date1, date2) {
		$("#stat_header").html(
            "Statistics ("
                + date1.toDateString()
                + " - "
                + date2.toDateString()
                + ")"
		);
    },
	
	getStatistics: function(fromDate, toDate) {
		this.setHeader(fromDate, toDate);
		// convert dates to seconds
		var fromValue = Math.floor(
				fromDate.getTime() / 1000),
            toValue = Math.ceil(
				toDate.getNextDay().getTime() / 1000);	
				
		var self = this;
		$('#button_select_range').button('loading');
		SCWeb.core.ui.Locker.show();
		
		self._getStatisticsData(fromValue, toValue,
			  function(data) {
				  // success
				  $('#button_select_range').button('reset');
				  SCWeb.core.ui.Locker.hide();
				  
				  self.data = data;
				  self.drawCharts();
				  
			  }, function() {
				  // error
				  $('#button_select_range').button('reset');
				  SCWeb.core.ui.Locker.hide();
				  alert("Can't get data!");
		  });
	},

    drawCharts: function() {
        this.clearDataTables();
        if (this.data.length != 0) {
        	var scaledData = this.scaleData(this.data, this.timeScale);
            this.fillDataTables(scaledData);
        }

        this.memChart.draw(this.memDataTable, this.memOptions);
        this.serverChart.draw(this.serverDataTable, this.serverOptions);
        this.elChart.draw(this.elDataTable, this.elOptions);
    },

    clearDataTables: function() {
        this.memDataTable.removeRows(0, this.memDataTable.getNumberOfRows());
        this.serverDataTable.removeRows(0, this.serverDataTable.getNumberOfRows());
        this.elDataTable.removeRows(0, this.elDataTable.getNumberOfRows());
    },

    fillDataTables: function(scaledData) {
        var memRows = new Array();
        var serverRows = new Array();
        var elRows = new Array();

        for (var i = 0; i < scaledData.length; i++) {
            var dataItem = scaledData[i];

            memRows.push([
                new Date(dataItem[0]),
                dataItem[4],
                dataItem[5],
                dataItem[6],
                dataItem[1] - dataItem[4],
                dataItem[2] - dataItem[5],
                dataItem[3] - dataItem[6],
                dataItem[7]
            ]);

            serverRows.push([
                new Date(dataItem[0]),
                dataItem[8],
                dataItem[9],
                dataItem[10]
            ]);
        }

        var size = scaledData.length;
        if (size > 0) {
			dataItem = scaledData[size - 1];
			elRows.push(["Nodes", dataItem[1]]);
            elRows.push(["Arcs", dataItem[2]]);
            elRows.push(["Links", dataItem[3]]); 
        }

        this.memDataTable.addRows(memRows);
        this.serverDataTable.addRows(serverRows);
        this.elDataTable.addRows(elRows);
    },

    scaleData: function (data, scale) {
		if (data.length == 1) {
			return data;
		}
		
        var result = [];
        var cmd = '';
        switch (scale) {
            case 'hour' :
                cmd = 'getHours';
                this.memOptions.hAxis.format = 'd MMM y';
                this.serverOptions.hAxis.format = 'd MMM y';
                break;
            case 'day' :
                cmd = 'getDay';
                this.memOptions.hAxis.format = 'd MMM y';
                this.serverOptions.hAxis.format = 'd MMM y';
                break;
            case 'week' :
                cmd = 'getWeek';
                this.memOptions.hAxis.format = 'd MMM y';
                this.serverOptions.hAxis.format = 'd MMM y';
                break;
            case 'month' :
                cmd = 'getMonth';
                this.memOptions.hAxis.format = 'MMM y';
                this.serverOptions.hAxis.format = 'MMM y';
                break;
            case 'year' :
                cmd = 'getFullYear';
                this.memOptions.hAxis.format = 'y';
                this.serverOptions.hAxis.format = 'y';
                break;
        }

        var groupTime = new Date(data[0][0])[cmd](),
            beginGroupIndex = 0,
            count = 1;
        for (var i = 1; i < data.length; i++) {
            var itemTime = new Date(data[i][0])[cmd]();
            if (groupTime == itemTime) {
                count++;
            } else {
                result.push(this.groupItems(beginGroupIndex, count, data));
                groupTime = itemTime;
                beginGroupIndex = i;
                count = 1;
            }
            if (i == data.length - 1) {
                result.push(this.groupItems(beginGroupIndex, count, data));
            }
        }

        return result;
    },

    groupItems: function(begin, count, data) {
        var item = data[begin].slice(0);

        // sum statistics data
        for (var i = begin + 1; i < begin + count; i++) {
            for (var j = 1; j < 11; j++) {
                item[j] += data[i][j];
            }
        }

        // average mean for memory statistics
        for (var i = 1; i < 8; i++) {
            item[i] = Math.ceil(item[i] / count);
        }

        return item;
    }

}


/** For a given date, get the ISO week number
 *
 * Algorithm is to find nearest thursday, it's year
 * is the year of the week number. Then get weeks
 * between that date and the first day of that year.
 */
Date.prototype.getWeek = function () {
    var day_miliseconds = 86400000,
        onejan = new Date(this.getFullYear(), 0, 1, 0, 0, 0);

    // Copy date so don't modify original
    var date = new Date(this);
    date.setHours(0, 0, 0);
    // Set to nearest Thursday: current date + 4 - current day number
    // Make Sunday's day number 7
    date.setDate(date.getDate() + 4 - (date.getDay() || 7));

    // Calculate full weeks to nearest Thursday
    return Math.ceil(
        (((date - onejan) / day_miliseconds) + onejan.getDay() + 1) / 7
    );
}

/**
 *  For a given date, get the next day
 */
Date.prototype.getNextDay = function () {
    var day_miliseconds = 86400000;
    return new Date(
        this.getTime() + day_miliseconds
    );
}


google.load("visualization", "1", {packages:["corechart"]});
google.setOnLoadCallback(start);

function start() {
	$(document).ready(function () {
	    Nav.stat.Main.init();
	});
}



