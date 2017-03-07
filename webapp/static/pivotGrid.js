var grid;

$(function() {
    $("#toolbar").dxToolbar({
	items: [
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

    grid = $("#pivotGrid").dxPivotGrid({
	dataSource: {
	    remoteOperations: true,
	    store: dataStore
	}
    }).dxPivotGrid("instance");
});
