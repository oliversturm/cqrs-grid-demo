var BASE = "http://localhost:3000/data/v1/values";

var dataStore = new DevExpress.data.CustomStore({
    key: "id",
    load: function(options) {
	var d = $.Deferred();
	$.getJSON(BASE).done(function(res) {
	    d.resolve(res, {
		totalCount: res.length
	    });
	});
	return d.promise();
    },
    byKey: function(key) {
	return $.getJSON(BASE + "/" + encodeURIComponent(key));
    },
    insert: function(value) {
	return $.ajax({
	    url: BASE,
	    method: "POST",
	    data: JSON.stringify(value),
	    contentType: "application/json"
	});
    },
    update: function(key, value) {
	return $.ajax({
	    url: BASE + "/" + encodeURIComponent(key),
	    method: "PUT",
	    data: JSON.stringify(value),
	    contentType: "application/json"
	});
    },
    remove: function(key) {
	return;
    }
});


$(function() {
    $("#grid").dxDataGrid({
	dataSource: {
	    store: dataStore
	},
	columns: [{
	    dataField: "test",
	    dataType: "number",
	    format: {
		type: "decimal"
	    }
	}, "val"],
	editing: {
	    mode: "batch",
	    allowAdding: true,
	    allowDeleting: true,
	    allowUpdating: true
	}
    });
});
