const fixObject = require('../message-utils').fixObject;

const { listValues, fetchValue } = require('./query.js');

module.exports = function(o = {}) {
  o.mongoDbName = 'cqrs_events';
  const conn = require('../db')(o);

  this.add('role:entitiesQuery, domain:events, cmd:list', (m, r) => {
    m = fixObject(m);

    //console.log('Query params: ', m.params);

    listValues(
      conn,
      'events',
      {
        replaceIds: false
      },
      m,
      r
    );
  });

  this.add('role:entitiesQuery, domain:events, cmd:fetch', (m, r) => {
    fetchValue(conn, 'events', 'id', m, r);
  });
};
