import { Component, ViewChild } from "@angular/core";

import { DxDataGridComponent } from "devextreme-angular";

import dataStore from "./dataStore.js";

@Component({
    template: require("./dataGrid.html")
})
export class DataGridComponent {
    @ViewChild(DxDataGridComponent) grid: DxDataGridComponent;

    public dataSource: any;

    constructor() {
	this.dataSource = {
	    store: dataStore
	};
    }
    
    refresh() {
	this.grid.instance.refresh();
    }
}
