var grid;

$(function() {
    var model = function() {
	var self = this;
	return {
	    toolbarOptions: {
		items: [
		    {
			location: "before",
			widget: "dxButton",
			locateInMenu: "auto",
			options: {
			    text: "Reload grid",
			    onClick: function() {
			self.grid.getDataSource().reload();
			    }
			}
		    }]
	    },
	    grid: {},
	    pivotGridOptions: {
		onInitialized: function(e) {
		    self.grid = e.component;
		},
		fieldPanel: {
		    visible: true
		},
		dataSource: {
		    remoteOperations: true,
		    store: dataStore,
		    retrieveFields: false,
		    fields: [
			{
			    dataField: "date1",
			    dataType: "date",
			    format: "shortDate",
			    allowFiltering: false,
			    allowSorting: true,
			    allowSortingBySummary: true,
			    area: "filter"
			},
			{
			    dataField: "date1",
			    caption: "date1 DOW",
			    dataType: "date",
			    allowFiltering: false,
			    allowSorting: true,
			    allowSortingBySummary: true,
			    area: "column",
			    areaIndex: 1,
			    groupInterval: "dayOfWeek"
			},
			{
			    dataField: "date1",
			    caption: "date1 Month",
			    dataType: "date",
			    allowFiltering: false,
			    allowSorting: true,
			    allowSortingBySummary: true,
			    area: "column",
			    areaIndex: 0,
			    groupInterval: "month"
			},
			{
			    dataField: "date2",
			    dataType: "date",
			    allowFiltering: true,
			    allowSorting: true,
			    allowSortingBySummary: true,
			    area: "filter",
			    groupInterval: "quarter"
			},
			{
			    dataField: "int1",
			    dataType: "number",
			    allowFiltering: true,
			    allowSorting: true,
			    allowSortingBySummary: true,
			    area: "data",
			    summaryType: "sum"
			},
			{
			    dataField: "int2",
			    dataType: "number",
			    allowFiltering: true,
			    allowSorting: true,
			    allowSortingBySummary: true,
			    area: "filter",
			    summaryType: "sum"
			},
			{
			    dataField: "int2",
			    caption: "int2 groupInt 10",
			    dataType: "number",
			    allowFiltering: true,
			    allowSorting: true,
			    allowSortingBySummary: true,
			    area: "row",
			    groupInterval: 10
			},
			{
			    dataField: "string",
			    dataType: "string",
			    allowFiltering: true,
			    allowSorting: true,
			    allowSortingBySummary: true,
			    area: "filter"
			}
		    ]
		}
	    }
	};
	
    };

    ko.applyBindings(model);
    
});
