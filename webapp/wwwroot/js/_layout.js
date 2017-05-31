function createTestObjects_click(e) {
  e.component.option('disabled', true);
  dataStore.createTestData(function() {
    e.component.option('disabled', false);
  });
}

function showDataGrid_click(e) {
  window.location.href = '/Home/DataGrid';
}

function showPivotGrid_click(e) {
  window.location.href = '/Home/PivotGrid';
}
