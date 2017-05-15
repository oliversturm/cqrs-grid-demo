const fixObject = require('../message-utils').fixObject;

const { listValues, fetchValue } = require('./query.js');

module.exports = function(o = {}) {
  const conn = require('../db')(o);

  this.add('role:entitiesQuery, domain:entity, cmd:list', (m, r) => {
    m = fixObject(m);

    //console.log('Query params: ', m.params);

    listValues(
      conn,
      'entity',
      {
        replaceIds: false
      },
      m,
      r
    );
  });

  this.add('role:entitiesQuery, domain:entity, cmd:fetch', (m, r) => {
    fetchValue(conn, 'entity', '_id', m, r);
  });
};
