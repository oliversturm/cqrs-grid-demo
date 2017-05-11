module.exports = function(liveClients) {
  this.add('role:querychangeevent', (m, r) => {
    //    console.log('Received query changed event for id ', m.queryId);

    if (liveClients.hasId(m.queryId)) {
      const socket = liveClients.getSocket(m.queryId);
      if (socket) {
        socket.emit('querychange', {
          liveId: m.queryId,
          aggregateId: m.aggregateId,
          triggerEvent: m.triggerEvent,
          aggregateIsPartOfQueryResult: m.aggregateIsPartOfQueryResult
        });
        //console.log(`Client notified for ${m.queryId}`);
      } else {
        console.error(`Socket for id ${m.queryId} is dead`);
        liveClients.deregister(m.queryId);
      }
    } else
      console.error(`Query change event received for unknown id ${m.queryId}`);

    r();
  });
};
