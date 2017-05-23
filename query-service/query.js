const query = require('devextreme-query-mongodb');

function listValues(connection, collection, queryParams, m, r) {
  connection(async db => {
    try {
      queryParams.timezoneOffset = m.timezoneOffset || 0;
      r(null, await query(db.collection(collection), m.params, queryParams));
    } catch (err) {
      r(null, { err$: err });
    }
  });
}

function fetchValue(connection, collection, idField, m, r) {
  connection(async db => {
    try {
      const res = await db.collection(collection).findOne({ [idField]: m.id });
      if (res) r(null, res);
      else r(null, { err$: 'unknownid' });
    } catch (err) {
      r(null, { err$: err });
    }
  });
}

module.exports = {
  listValues,
  fetchValue
};
