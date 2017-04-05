import { NgModule } from "@angular/core";
import { BrowserModule } from "@angular/platform-browser";
import { routing, RootComponent } from "./routes";

import { DataGridComponent } from "./dataGrid";
import { PivotGridComponent } from "./pivotGrid";

import { DxButtonModule,
         DxToolbarModule,
         DxPivotGridModule,
         DxDataGridModule } from "devextreme-angular";

@NgModule({
    imports: [
	BrowserModule,
	routing,
	DxButtonModule,
	DxToolbarModule,
	DxPivotGridModule,
	DxDataGridModule
    ],
    declarations: [
	RootComponent,
	DataGridComponent,
	PivotGridComponent
    ],
    bootstrap: [RootComponent]
})
export class AppModule {}
