var grid;

$(function() {
  var trackingConfig = {
    grid
  };

  var dataSource = createDataSource({
    baseDataUrl: '/data/v1/events',
    idField: 'id',
    changeNotification: trackGridChanges(trackingConfig),
    notifyForAnyChange: true,
    socketIoUrl: '/'
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
          dataField: 'type',
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
        'aggregateId',
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
