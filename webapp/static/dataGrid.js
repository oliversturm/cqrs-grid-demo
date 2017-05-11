var grid;

$(function() {
  var dataStore = createDataStore(
    'http://localhost:3000/data/v1/values',
    '_id',
    function(changeInfo) {
      if (changeInfo.batchUpdate) {
        console.log('full refresh');

        grid.refresh();
      } else {
        const map = {
          entityUpdated: {
            true(event) {
              const index = grid.getRowIndexByKey(event.data._id);
              const row = grid.getDataSource().items()[index];
              Object.assign(row, event.data);
              grid.repaintRows([index]);

              console.log('upd true');
            },
            false(event) {
              const index = grid.getRowIndexByKey(event.data._id);
              const items = grid.getDataSource().items();
              items.splice(index, 1);
              grid.repaintRows([index]);

              console.log('upd false');
            }
          },
          entityCreated: {
            true(event) {
              const items = grid.getDataSource().items();
              items.splice(event.dataIndex, 0, event.data);
              grid.repaintRows([event.dataIndex]);

              console.log('crea true');
            }
            // false case doesn't exist
          }
        };

        changeInfo.events.forEach(e =>
          map[e.triggerEvent][e.aggregateIsPartOfQueryResult](e)
        );
      }
    },
    'http://localhost:3000'
  );

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
      dataSource: {
        store: dataStore
      },
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
});
