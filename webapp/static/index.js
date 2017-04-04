console.log("DevExtreme version: ", DevExpress.VERSION);

$(function() {
    var model = {
	toolbarOptions: {
	    items: [
		{
		    location: "before",
		    widget: "dxButton",
		    locateInMenu: "auto",
		    options: {
			type: "danger",
			text: "Create 1000 Test Objects",
			onClick: function(e) {
			    e.component.option("disabled", true);
			    dataStore.createTestData(function() {
				e.component.option("disabled", false);
			    });
			}
		    }
		},
		{
		    location: "before",
		    widget: "dxButton",
		    locateInMenu: "auto",
		    options: {
			type: "success",
			text: "Show Data Grid",
			onClick: function(e) {
			    window.open("dataGrid.html", "frame");
			}
		    }
		},
		{
		    location: "before",
		    widget: "dxButton",
		    locateInMenu: "auto",
		    options: {
			type: "success",
			text: "Show Pivot Grid",
			onClick: function(e) {
			    window.open("pivotGrid.html", "frame");
			}
		    }
		}]
	}
    };
    ko.applyBindings(model);

    window.open("dataGrid.html", "frame");
});
