function isGroupCollection(data) {
  // doesn't seem completely safe
  // but I'm not aware of another way
  return data && data.length > 0 && data[0].key && data[0].items;
}

function findCollectionIncludingId(data, id) {
  var empty = {
    list: undefined,
    index: undefined
  };

  if (!data || data.length === 0) return empty;

  if (isGroupCollection(data)) {
    return data.reduce(function(r, v) {
      return r.list ? r : findCollectionIncludingId(v.items, id);
    }, empty);
  } else {
    var index = data.findIndex(function(d) {
      return d._id === id;
    });
    if (index === -1) return empty;
    else
      return {
        list: data,
        index
      };
  }
}

function trackGridChanges(trackingConfig) {
  return function(changeInfo) {
    if (changeInfo.batchUpdate) {
      trackingConfig.grid.refresh();
    } else {
      var map = {
        updated: {
          true(event) {
            var index = trackingConfig.grid.getRowIndexByKey(event.aggregateId);
            if (index === -1) return;
            // This method of accessing the data object works for both
            // simple queries and those where the row in question is
            // nested in a group.
            var row = trackingConfig.grid.getVisibleRows()[index].data;
            if (!row) return;
            Object.assign(row, event.data);
            trackingConfig.grid.repaintRows([index]);
          },
          false(event) {
            var found = findCollectionIncludingId(
              trackingConfig.grid.getDataSource().items(),
              event.aggregateId
            );
            if (found.list) {
              found.list.splice(found.index, 1);
              trackingConfig.grid.repaintRows([found.index]);
            }
          }
        },
        created: {
          true(event) {
            var items = trackingConfig.grid.getDataSource().items();
            if (!items) return;
            if (!isGroupCollection(items)) {
              // we can add the item into the collection elegantly
              items.splice(event.dataIndex, 0, event.data);
              trackingConfig.grid.repaintRows([event.dataIndex]);
            } else {
              // Since this is a group collection, it would be very hard at
              // this point to find out where in the nested hierarchy this item
              // belongs. Unfortunately the data grid runs simple queries for the
              // content of groups, retrieving only the grouping itself in a
              // grouped query. When the simple queries are tracked and we
              // receive a change notification, we might end up here - but we
              // have no information about the grouping of the item in the
              // larger context and therefor can't easily add the item correctly.
              trackingConfig.grid.refresh();
            }
          }
          // false case doesn't exist
        }
      };

      changeInfo.events.forEach(e =>
        map[e.triggerEvent][e.aggregateIsPartOfQueryResult](e)
      );
    }
  };
}
