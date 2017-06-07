var grid;

$(function() {
  var trackingConfig = {
    grid
  };

  var dataSource = createDataSource({
    baseDataUrl: '//localhost:3000/data/v1/entity',
    changeNotification: trackGridChanges(trackingConfig),
    aggregateName: 'entity',
    socketIoUrl: '//localhost:3000'
  });

  $('#toolbar').dxToolbar({
    items: [
      {
        location: 'before',
        widget: 'dxButton',
        locateInMenu: 'auto',
        options: {
          text: 'Reload grid',
          onClick: function() {
            grid.refresh();
          }
        }
      },
      {
        location: 'before',
        widget: 'dxCheckBox',
        locateInMenu: 'auto',
        options: {
          text: 'Automatic Reloading',
          value: true,
          onValueChanged: function(e) {
            if (e.value) {
              grid.refresh();
            } else {
              dataSource.stopTracking();
            }
          }
        }
      }
    ]
  });

  grid = $('#grid')
    .dxDataGrid({
      dataSource: dataSource,
      //	remoteOperations: true,
      remoteOperations: {
        filtering: true,
        grouping: true,
        groupPaging: true,
        paging: true,
        sorting: true,
        summary: true
      },
      columns: [
        {
          dataField: 'date1',
          dataType: 'date'
        },
        {
          dataField: 'date2',
          dataType: 'date'
        },
        {
          dataField: 'int1',
          dataType: 'number',
          format: {
            type: 'decimal'
          }
        },
        {
          dataField: 'int2',
          dataType: 'number',
          format: {
            type: 'decimal'
          }
        },
        'string'
      ],
      editing: {
        mode: 'batch',
        allowAdding: true,
        allowDeleting: true,
        allowUpdating: true
      },
      filterRow: {
        visible: true
      },
      headerFilter: {
        visible: true
      },
      groupPanel: {
        visible: true
      },
      grouping: {
        autoExpandAll: false
      },
      summary: {
        totalItems: [
          {
            column: 'date1',
            summaryType: 'max'
          },
          {
            column: 'int1',
            summaryType: 'avg'
          },
          {
            column: 'int1',
            summaryType: 'sum'
          }
        ],
        groupItems: [
          {
            column: 'date1',
            summaryType: 'min'
          },
          {
            column: 'int1',
            summaryType: 'avg'
          },
          {
            column: 'int1',
            summaryType: 'sum'
          },
          {
            summaryType: 'count'
          }
        ]
      }
    })
    .dxDataGrid('instance');

  trackingConfig.grid = grid;
});
