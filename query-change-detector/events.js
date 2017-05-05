const fixObject = require('../message-utils').fixObject;

function findId(data, id) {
  return data.find(d => d._id === id);
}

function checkQueries(seneca, store, aggregateId, triggerEvent) {
  console.log(`Checking ${store.ids().length} queries`);

  store
    .ids()
    .map(id => {
      console.log('mapping id ', id);

      return {
        id,
        params: store.get(id)
      };
    })
    .forEach(q => {
      seneca.act(
        {
          role: 'entitiesQuery',
          domain: 'values',
          cmd: 'list',
          params: q.params
        },
        (err, res) => {
          seneca.act({
            role: 'querychangeevent',
            queryId: q.id,
            aggregateId,
            triggerEvent,
            aggregateIsPartOfQueryResult: !!findId(res.data, aggregateId)
          });
        }
      );
    });
}

module.exports = function(store) {
  const knownEvents = ['entityCreated', 'entityUpdated'];

  this.add('role: event', function(m, r) {
    //console.log('Event received: ', m.event);
    if (knownEvents.includes(m.eventName)) {
      checkQueries(this, store, m.event.aggregate.id, m.eventName);
    }
    r();
  });
};
