import {Component} from "@angular/core";

@Component({
    template: require("./pivotGrid.html")
})
export class PivotGridComponent {
    public message: string;

    constructor() {
	this.message = "Hi from the pivot grid";
    }
}
