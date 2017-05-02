const fixObject = require('../message-utils').fixObject;

const { listValues, fetchValue } = require('./query.js');

module.exports = function(o = {}) {
  const conn = require('../db')(o);

  this.add('role:entitiesQuery, domain:values, cmd:list', (m, r) => {
    m = fixObject(m);

    //console.log('Query params: ', m.params);

    listValues(
      conn,
      'values',
      {
        replaceIds: false
      },
      m,
      r
    );
  });

  this.add('role:entitiesQuery, domain:values, cmd:fetch', (m, r) => {
    fetchValue(conn, 'values', '_id', m, r);
  });
};
