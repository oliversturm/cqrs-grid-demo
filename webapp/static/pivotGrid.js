var grid;

$(function() {
  var trackingConfig = {
    grid
  };

  $('#toolbar').dxToolbar({
    items: [
      {
        location: 'before',
        widget: 'dxButton',
        locateInMenu: 'auto',
        options: {
          text: 'Reload grid',
          onClick: function() {
            grid.getDataSource().reload();
          }
        }
      }
    ]
  });

  grid = $('#pivotGrid')
    .dxPivotGrid({
      fieldPanel: {
        visible: true
      },
      dataSource: createPivotGridDataSource(
        {
          remoteOperations: true,
          retrieveFields: false,
          fields: [
            {
              dataField: 'date1',
              dataType: 'date',
              format: 'shortDate',
              allowFiltering: false,
              allowSorting: true,
              allowSortingBySummary: true,
              area: 'filter'
            },
            {
              dataField: 'date1',
              caption: 'date1 DOW',
              dataType: 'date',
              allowFiltering: false,
              allowSorting: true,
              allowSortingBySummary: true,
              area: 'column',
              areaIndex: 1,
              groupInterval: 'dayOfWeek'
            },
            {
              dataField: 'date1',
              caption: 'date1 Month',
              dataType: 'date',
              allowFiltering: false,
              allowSorting: true,
              allowSortingBySummary: true,
              area: 'column',
              areaIndex: 0,
              groupInterval: 'month'
            },
            {
              dataField: 'date2',
              dataType: 'date',
              allowFiltering: true,
              allowSorting: true,
              allowSortingBySummary: true,
              area: 'filter',
              groupInterval: 'quarter'
            },
            {
              dataField: 'int1',
              dataType: 'number',
              allowFiltering: true,
              allowSorting: true,
              allowSortingBySummary: true,
              area: 'data',
              summaryType: 'sum'
            },
            {
              dataField: 'int2',
              dataType: 'number',
              allowFiltering: true,
              allowSorting: true,
              allowSortingBySummary: true,
              area: 'filter',
              summaryType: 'sum'
            },
            {
              dataField: 'int2',
              caption: 'int2 groupInt 10',
              dataType: 'number',
              allowFiltering: true,
              allowSorting: true,
              allowSortingBySummary: true,
              area: 'row',
              groupInterval: 10
            },
            {
              dataField: 'string',
              dataType: 'string',
              allowFiltering: true,
              allowSorting: true,
              allowSortingBySummary: true,
              area: 'filter'
            }
          ]
        },
        {
          baseDataUrl: 'http://localhost:3000/data/v1/entity',
          changeNotification: trackPivotGridChanges(trackingConfig),
          aggregateName: 'entity',
          socketIoUrl: 'http://localhost:3000',
          trackGroupQueries: true
        }
      )
    })
    .dxPivotGrid('instance');

  trackingConfig.grid = grid;
});
