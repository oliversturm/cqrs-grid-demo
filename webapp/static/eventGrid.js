var grid;

$(function() {
  var trackingConfig = {
    grid
  };

  var dataSource = createDataSource({
    baseDataUrl: '//localhost:3000/data/v1/events',
    idField: 'id',
    changeNotification: trackGridChanges(trackingConfig),
    notifyForAnyChange: true,
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
      }
    ]
  });

  grid = $('#grid')
    .dxDataGrid({
      dataSource: dataSource,
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
          dataField: 'name',
          caption: 'Type'
        },
        {
          dataField: 'payload',
          allowFiltering: false,
          allowGrouping: false,
          allowSearch: false,
          allowSorting: false,
          customizeText: function(ci) {
            return JSON.stringify(ci.value);
          }
        },
        'aggregate.id',
        {
          dataField: 'timestamp',
          dataType: 'date',
          format: 'shortDateShortTime',
          sortOrder: 'desc',
          sortIndex: 0
        }
      ],
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
        groupItems: [
          {
            summaryType: 'count'
          }
        ]
      }
    })
    .dxDataGrid('instance');

  trackingConfig.grid = grid;
});
