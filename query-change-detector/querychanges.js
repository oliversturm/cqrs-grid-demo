const fixObject = require('../message-utils').fixObject;

module.exports = function(store) {
  this.add('role: querychanges, cmd: register', (m, r) => {
    m = fixObject(m);
    r(null, {
      registered: store.register(
        m.id,
        m.idFieldName,
        m.aggregateName,
        m.queryMessage,
        m.notifyForAnyChange
      )
    });
  });

  this.add('role: querychanges, cmd: deregister', (m, r) => {
    store.deregister(m.id);
    r();
  });
};
