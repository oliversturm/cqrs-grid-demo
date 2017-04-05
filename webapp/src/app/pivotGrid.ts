import { Component, ViewChild } from "@angular/core";

import { DxPivotGridComponent } from "devextreme-angular";

import dataStore from "./dataStore.js";

@Component({
    template: require("./pivotGrid.html")
})
export class PivotGridComponent {
    @ViewChild(DxPivotGridComponent) grid: DxPivotGridComponent;

    dataStore = dataStore;
    
    refresh() {
	this.grid.instance.getDataSource().reload();
    }
}
