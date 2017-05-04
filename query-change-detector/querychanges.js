const fixObject = require('../message-utils').fixObject;

module.exports = function(store) {
  this.add('role: querychanges, cmd: register', (m, r) => {
    m = fixObject(m);
    r(null, {
      registered: store.register(m.id, m.queryParams)
    });
  });
};
