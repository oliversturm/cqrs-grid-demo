import {Component} from "@angular/core";
import {RouterModule, Routes} from "@angular/router";
import {DataGridComponent} from "./dataGrid";
import {PivotGridComponent} from "./pivotGrid";

@Component({
    selector: "demo-root",
    template: require("./menu.html")
})
export class RootComponent {}

export const routes: Routes = [
    { path: "", redirectTo: "/dataGrid", pathMatch: "full" },
    { path: "dataGrid", component: DataGridComponent },
    { path: "pivotGrid", component: PivotGridComponent }
];

export const routing = RouterModule.forRoot(routes);
