var BASEDATA = "http://localhost:3000/data/v1/values";
var BASEAPI = "http://localhost:3000/api/v1";

var debugId = 0;

var dataStore = new DevExpress.data.CustomStore({
    key: "_id",
    load: function(options) {
	// from https://www.devexpress.com/Support/Center/Question/Details/KA18955
	var params = {};

        if (options.filter) params.filter = JSON.stringify(options.filter);
	if (options.sort) params.sort = JSON.stringify(options.sort);            
        
        params.skip = options.skip;
        params.take = options.take;
	params.requireTotalCount = options.requireTotalCount;

	if (options.totalSummary) params.totalSummary = JSON.stringify(options.totalSummary);

	// Oliver: this is the projection - outstanding question - do our controls use this?
	// I haven't seen it so far...
        if (options.select) params.select= JSON.stringify(options.select);   

        // If a user typed something in dxAutocomplete, dxSelectBox or dxLookup (original comment)
	// The dxDataGrid doesn't use this parameter, it uses "filter" instead...
	// actually, these options reflect the functionality of "filter" exactly, with the one
	// exception that searchExpr can be an array of field names, or just one.
	// I decided to transfer the parameters to the server anyway - could transpose them right here.
        if (options.searchValue)  {
            params.searchValue= options.searchValue;
            params.searchOperation= options.searchOperation;
            params.searchExpr= options.searchExpr;
        }

	if (options.group)  {
            params.group = JSON.stringify(options.group);
	    params.requireGroupCount = options.requireGroupCount;
	    if (options.groupSummary) params.groupSummary = JSON.stringify(options.groupSummary);
        }
	
	var d = $.Deferred();
	d.debugId = debugId++;
	
	console.log("Load options (" + d.debugId + "): ", options);
	
	$.getJSON(BASEDATA, params).done(function(res) {
	    //console.log("Static load result (" + d.debugId + "): " + JSON.stringify(res));
	    console.log("Load result (" + d.debugId + "): ", res);

	    var details = {};
	    if (options.requireTotalCount) details.totalCount = res.totalCount;
	    if (options.requireGroupCount) details.groupCount = res.groupCount;
	    if (options.totalSummary) details.summary = res.summary;
	    
	    
	    d.resolve(res.data, details);
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

dataStore.createTestData = function(cont) {
    setTimeout(function() {
	$.ajax({
	    url: BASEAPI + "/createTestData?count=" + encodeURIComponent(1000),
	    method: "GET",
	    contentType: "application/json"
	}).then(function() {
	    cont();
	});
    });
};
