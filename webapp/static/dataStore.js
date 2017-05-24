var debugId = 0;

function createDataStore(options) {
  const dataStoreOptions = Object.assign(
    {
      baseDataUrl: 'http://localhost',
      idField: '_id',
      changeNotification: undefined,
      aggregateName: undefined,
      trackGroupQueries: false,
      notifyForAnyChange: false,
      socketIoUrl: 'http://localhost',
      summaryQueryLimit: undefined
    },
    options
  );

  var store = new DevExpress.data.CustomStore({
    key: dataStoreOptions.idField,
    load: function(options) {
      var store = this;

      // from https://www.devexpress.com/Support/Center/Question/Details/KA18955
      var params = {};

      if (options.filter) params.filter = JSON.stringify(options.filter);
      if (options.sort) params.sort = JSON.stringify(options.sort);

      if (dataStoreOptions.summaryQueryLimit)
        params.summaryQueryLimit = dataStoreOptions.summaryQueryLimit;

      params.skip = options.skip;
      params.take = options.take;
      params.requireTotalCount = options.requireTotalCount;

      if (options.totalSummary)
        params.totalSummary = JSON.stringify(options.totalSummary);

      // Oliver: this is the projection - outstanding question - do our controls use this?
      // I haven't seen it so far...
      if (options.select) params.select = JSON.stringify(options.select);

      // If a user typed something in dxAutocomplete, dxSelectBox or dxLookup (original comment)
      // The dxDataGrid doesn't use this parameter, it uses "filter" instead...
      // actually, these options reflect the functionality of "filter" exactly, with the one
      // exception that searchExpr can be an array of field names, or just one.
      // I decided to transfer the parameters to the server anyway - could transpose them right here.
      if (options.searchValue) {
        params.searchValue = options.searchValue;
        params.searchOperation = options.searchOperation;
        params.searchExpr = options.searchExpr;
      }

      if (options.group) {
        params.group = JSON.stringify(options.group);
        params.requireGroupCount = options.requireGroupCount;
        if (options.groupSummary)
          params.groupSummary = JSON.stringify(options.groupSummary);
      }

      if (
        dataStoreOptions.changeNotification &&
        (dataStoreOptions.notifyForAnyChange ||
          dataStoreOptions.aggregateName) &&
        (!options.group || dataStoreOptions.trackGroupQueries)
      ) {
        params.live = true;
        params.idFieldName = dataStoreOptions.idField;
        params.aggregateName = dataStoreOptions.aggregateName;
        params.notifyForAnyChange = dataStoreOptions.notifyForAnyChange;
      }

      params.tzOffset = new Date().getTimezoneOffset();

      var d = $.Deferred();
      d.debugId = debugId++;

      console.log('Load params (' + d.debugId + '): ', params);

      $.getJSON(dataStoreOptions.baseDataUrl, params).done(function(res) {
        //console.log("Static load result (" + d.debugId + "): " + JSON.stringify(res));
        console.log('Load result (' + d.debugId + '): ', res);

        var details = {};
        if (options.requireTotalCount) details.totalCount = res.totalCount;
        if (options.requireGroupCount) details.groupCount = res.groupCount;
        if (options.totalSummary) details.summary = res.summary;

        if (params.live && res.liveId) {
          var socket = io.connect(dataStoreOptions.socketIoUrl);
          socket.on('hello', function(args, reply) {
            socket.on('registered', function() {
              store.registerSocket(res.liveId, socket);
              socket.on('querychange', function(changeInfo) {
                dataStoreOptions.changeNotification(changeInfo);
              });
            });

            reply({
              liveId: res.liveId
            });
          });
        }

        d.resolve(res.data, details);
      });
      return d.promise();
    },
    byKey: function(key) {
      return $.getJSON(
        dataStoreOptions.baseDataUrl + '/' + encodeURIComponent(key)
      );
    },
    insert: function(value) {
      return $.ajax({
        url: dataStoreOptions.baseDataUrl,
        method: 'POST',
        data: JSON.stringify(value),
        contentType: 'application/json'
      });
    },
    update: function(key, value) {
      return $.ajax({
        url: dataStoreOptions.baseDataUrl + '/' + encodeURIComponent(key),
        method: 'PUT',
        data: JSON.stringify(value),
        contentType: 'application/json'
      });
    },
    remove: function(key) {
      return;
    }
  });

  store.sockets = {};

  store.registerSocket = function(id, socket) {
    this.sockets[id] = socket;
  };
  store.deregisterSocket = function(id) {
    delete this.sockets[id];
  };
  store.closeAllSockets = function() {
    var store = this;

    Object.getOwnPropertyNames(store.sockets).forEach(function(id) {
      store.sockets[id].disconnect(true);
    });
    store.sockets = {};
  };

  return store;
}

function testDataStore(dataStore, baseApiUrl) {
  dataStore.createTestData = function(cont) {
    setTimeout(function() {
      $.ajax({
        url: baseApiUrl + '/createTestData?count=' + encodeURIComponent(1000),
        method: 'GET',
        contentType: 'application/json'
      }).then(function() {
        cont();
      });
    });
  };
  return dataStore;
}

function createDataSource(options) {
  var dataSource = new DevExpress.data.DataSource({
    store: createDataStore(options),
    onLoadingChanged: function(isLoading) {
      if (isLoading) this.store().closeAllSockets();
    }
  });

  dataSource.stopTracking = function() {
    this.store().closeAllSockets();
  };

  return dataSource;
}

function createPivotGridDataSource(pivotGridConfig, options) {
  pivotGridConfig.store = createDataStore(options);

  pivotGridConfig.onLoadingChanged = function(isLoading) {
    if (isLoading) this.store()._store.closeAllSockets();
  };

  var dataSource = new DevExpress.data.PivotGridDataSource(pivotGridConfig);
  dataSource.stopTracking = function() {
    this.store()._store.closeAllSockets();
  };

  return dataSource;
}
