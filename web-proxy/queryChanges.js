module.exports = function(liveClients) {
  this.add('role:querychangeevent', (m, r) => {
    console.log('Received query changed event for id ', m.queryId);

    if (liveClients.hasId(m.queryId)) {
      liveClients.getSocket(m.queryId).emit('querychange', {
        liveId: m.queryId,
        aggregateId: m.aggregateId,
        triggerEvent: m.triggerEvent,
        aggregateIsPartOfQueryResult: m.aggregateIsPartOfQueryResult
      });
      console.log('Client notified');
    } else
      console.error(`Query change event received for unknown id ${m.queryId}`);

    r();
  });
};
