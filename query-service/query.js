const query = require('devextreme-query-mongodb');

function listValues(connection, collection, queryParams, m, r) {
  // Prettier wants to remove the parens here
  // prettier-ignore
  connection(async (db) => {
    try {
      r(null, await query(db.collection(collection), m.params, queryParams));
    } catch (err) {
      r(null, { err$: err });
    }
  });
}

function fetchValue(connection, collection, idField, m, r) {
  // prettier-ignore
  connection(async (db) => {
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
