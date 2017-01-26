var BASEDATA = "http://localhost:3000/data/v1/values";
var BASEAPI = "http://localhost:3000/api/v1";

console.log("DevExtreme version: ", DevExpress.VERSION);

var dataStore = new DevExpress.data.CustomStore({
    key: "id",
    load: function(options) {
	console.log("Load options: ", options);
	
	// from https://www.devexpress.com/Support/Center/Question/Details/KA18955
	var params = {};
        //Getting filter options
        if (options.filter)  {
            params.filter = JSON.stringify(options.filter);
        }
        //Getting sort options
        if (options.sort)  {
            params.sort = JSON.stringify(options.sort);
        }            
        //Getting group options
        if (options.group)  {
            params.group = JSON.stringify(options.group);
	    params.requireGroupCount = options.requireGroupCount;
        }            
        //skip and take are used for paging
        params.skip = options.skip; //A number of records that should be skipped
        params.take = options.take; //A number of records that should be taken

        //If the select expression is specified
	// Oliver: this is the projection - outstanding question - do our controls use this?
        if (options.select)  {
            params.select= JSON.stringify(options.select);
        }   

        //If a user typed something in dxAutocomplete, dxSelectBox or dxLookup
        if (options.searchValue)  {
            params.searchValue= options.searchValue;
            params.searchOperation= options.searchOperation;
            params.searchExpr= options.searchExpr;
        }
	
	var d = $.Deferred();
	$.getJSON(BASEDATA, params).done(function(res) {
	    if (options.dataField) {
		// this seems to be the header filter
		console.log("header filter query result ", JSON.stringify(res));
		
	    }
	    console.log("Load result: ", res);
	    
	    d.resolve(res.data, {
		totalCount: res.totalCount,
		groupCount: res.groupCount
	    });
	});
	return d.promise();
    },
    byKey: function(key) {
	return $.getJSON(BASEDATA + "/" + encodeURIComponent(key));
    },
    insert: function(value) {
	return $.ajax({
	    url: BASEDATA,
	    method: "POST",
	    data: JSON.stringify(value),
	    contentType: "application/json"
	});
    },
    update: function(key, value) {
	return $.ajax({
	    url: BASEDATA + "/" + encodeURIComponent(key),
	    method: "PUT",
	    data: JSON.stringify(value),
	    contentType: "application/json"
	});
    },
    remove: function(key) {
	return;
    }
});

var grid;

$(function() {
    $("#toolbar").dxToolbar({
	items: [
	    {
		location: "before",
		widget: "dxButton",
		locateInMenu: "auto",
		options: {
		    text: "Create 10000 Test Objects",
		    onClick: function(e) {
			e.component.option("disabled", true);
			setTimeout(function() {
			    $.ajax({
				url: BASEAPI + "/createTestData?count=" + encodeURIComponent(10000),
				method: "GET",
				contentType: "application/json"
			    }).then(function() {
				e.component.option("disabled", false);
			    });
			});
		    }
		}
	    },
	    {
		location: "before",
		widget: "dxButton",
		locateInMenu: "auto",
		options: {
		    text: "Reload grid",
		    onClick: function() {
			grid.refresh();
		    }
		}
	    }]
    });

    grid = $("#grid").dxDataGrid({
	dataSource: {
	    store: dataStore
	},
	//	remoteOperations: true,
	remoteOperations: {
	    filtering: true,
	    grouping: true,
	    groupPaging: true,
	    paging: true,
	    sorting: true,
	    sumary: true
	},
	columns: [{
	    dataField: "date1",
	    dataType: "date"
	},{
	    dataField: "date2",
	    dataType: "date"
	},{
	    dataField: "int1",
	    dataType: "number",
	    format: {
		type: "decimal"
	    }
	},{
	    dataField: "int2",
	    dataType: "number",
	    format: {
		type: "decimal"
	    }
	},
		  "string"],
	editing: {
	    mode: "batch",
	    allowAdding: true,
	    allowDeleting: true,
	    allowUpdating: true
	},
	filterRow: {
	    visible: true
	},
	headerFilter: {
	    visible: true
	},
	groupPanel: {
	    visible: true
	},
	grouping: {
	    autoExpandAll: false
	}
    }).dxDataGrid("instance");
});
