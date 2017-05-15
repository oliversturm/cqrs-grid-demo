console.log('DevExtreme version: ', DevExpress.VERSION);

$(function() {
  const dataStore = testDataStore(
    createDataStore({
      baseDataUrl: 'http://localhost:3000/data/v1/entity'
    }),
    'http://localhost:3000/api/v1'
  );

  $('#toolbar').dxToolbar({
    items: [
      {
        location: 'before',
        widget: 'dxButton',
        locateInMenu: 'auto',
        options: {
          type: 'danger',
          text: 'Create 1000 Test Objects',
          onClick: function(e) {
            e.component.option('disabled', true);
            dataStore.createTestData(function() {
              e.component.option('disabled', false);
            });
          }
        }
      },
      {
        location: 'before',
        widget: 'dxButton',
        locateInMenu: 'auto',
        options: {
          type: 'danger',
          text: 'Show Events',
          onClick: function(e) {
            window.open('eventGrid.html', 'frame');
          }
        }
      },
      {
        location: 'before',
        widget: 'dxButton',
        locateInMenu: 'auto',
        options: {
          type: 'success',
          text: 'Show Data Grid',
          onClick: function(e) {
            window.open('dataGrid.html', 'frame');
          }
        }
      },
      {
        location: 'before',
        widget: 'dxButton',
        locateInMenu: 'auto',
        options: {
          type: 'success',
          text: 'Show Pivot Grid',
          onClick: function(e) {
            window.open('pivotGrid.html', 'frame');
          }
        }
      }
    ]
  });

  window.open('dataGrid.html', 'frame');
});
