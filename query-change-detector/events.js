const fixObject = require('../message-utils').fixObject;

module.exports = (() => {
  function findId(data, id, idFieldName) {
    return data.find(d => d[idFieldName] === id);
  }

  function checkQueries(seneca, store, aggregateId, triggerEvent) {
    //console.log(`Checking ${store.ids().length} queries`);

    store
      .ids()
      .map(id => ({
        id,
        params: store.get(id)
      }))
      .forEach(q => {
        seneca.act(
          {
            role: 'entitiesQuery',
            domain: 'values',
            cmd: 'list',
            params: q.params.queryParams
          },
          (err, res) => {
            seneca.act({
              role: 'querychangeevent',
              queryId: q.id,
              aggregateId,
              triggerEvent,
              aggregateIsPartOfQueryResult: !!findId(
                res.data,
                aggregateId,
                q.params.idFieldName
              )
            });
          }
        );
      });
  }

  function batchNotify(seneca, store) {
    store.ids().forEach(id => {
      seneca.act({
        role: 'querychangeevent',
        queryId: id,
        batchUpdate: true
      });
    });
  }

  const createEventQueue = () => ({
    events: [],
    queue(e) {
      this.events.push(e);
    },
    dequeue() {
      return this.events.shift();
    },
    eventCount() {
      return this.events.length;
    },
    killQueue() {
      this.events = [];
    },
    lastEventTimestamp: undefined,
    oldestEventTimestamp: undefined
  });

  function loop(seneca, o, eventQueue) {
    const eventCount = eventQueue.eventCount();
    if (eventCount > 0) {
      const stamp = Date.now();

      // checking is required when either the oldest event is too old by now
      // or when the newest event is a certain time ago
      const checkRequired =
        stamp - eventQueue.oldestEventTimestamp > o.eventMaxAge ||
        stamp - eventQueue.lastEventTimestamp > o.eventGapTime;

      if (checkRequired) {
        if (eventCount >= o.minimumBatchSize) {
          batchNotify(seneca, o.store);
          eventQueue.killQueue();
        } else {
          let e;
          while ((e = eventQueue.dequeue())) {
            checkQueries(seneca, o.store, e.aggregateId, e.eventName);
          }
        }
      }
    }

    setTimeout(() => loop(seneca, o, eventQueue), o.loopDelay);
  }

  return function(o) {
    // eventGapTime defines how long a gap in the sequence should be
    // before we decide it's time to handle the queue
    if (!o.eventGapTime) o.eventGapTime = 300;

    // eventMaxAge defines how old the oldest event can get before
    // we start handling the queue even if eventGapTime has not been reached
    if (!o.eventMaxAge) o.eventMaxAge = 2000;

    // If there are at least minimumBatchSize events in the queue when time
    // comes to handle it, we trigger notifications for batch update instead
    // of checking each query individually.
    if (!o.minimumBatchSize) o.minimumBatchSize = 10;

    // loopDelay specifies how often the event checking loop will run
    if (!o.loopDelay) o.loopDelay = 100;

    const knownEvents = ['entityCreated', 'entityUpdated'];

    const eventQueue = createEventQueue();
    setTimeout(() => loop(this, o, eventQueue), o.loopDelay);

    this.add('role: event', function(m, r) {
      //console.log('Event received: ', m.event);
      if (knownEvents.includes(m.eventName)) {
        const stamp = Date.now();
        eventQueue.lastEventTimestamp = stamp;
        if (eventQueue.eventCount() == 0)
          eventQueue.oldestEventTimestamp = stamp;

        eventQueue.queue({
          aggregateId: m.event.aggregate.id,
          eventName: m.eventName
        });
      }
      r();
    });
  };
})();
