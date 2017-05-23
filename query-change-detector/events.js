const fixObject = require('../message-utils').fixObject;

module.exports = (() => {
  function findId(data, id, idFieldName) {
    const index = data.findIndex(d => d[idFieldName] === id);
    return index === -1 ? undefined : index;
  }

  function checkQueries(seneca, store, aggregateName, events) {
    store
      .ids()
      .map(id => ({
        id,
        params: store.get(id)
      }))
      .filter(
        q =>
          q.params.notifyForAnyChange ||
          q.params.aggregateName === aggregateName
      )
      .forEach(q => {
        if (q.params.queryMessage.params.group || q.params.notifyForAnyChange) {
          seneca.act({
            role: 'querychangeevent',
            queryId: q.id,
            batchUpdate: true
          });
        } else
          seneca.act(q.params.queryMessage, (err, res) => {
            const results = events.reduce((r, v) => {
              const dataIndex = findId(
                res.data,
                v.aggregateId,
                q.params.idFieldName
              );
              const isPart = dataIndex != undefined;

              if (isPart || v.eventName != 'entityCreated')
                r.push({
                  aggregateId: v.aggregateId,
                  triggerEvent: v.eventName,
                  aggregateIsPartOfQueryResult: isPart,
                  data: isPart ? res.data[dataIndex] : undefined,
                  dataIndex
                });
              return r;
            }, []);

            if (results.length > 0)
              seneca.act({
                role: 'querychangeevent',
                queryId: q.id,
                events: results
              });
          });
      });
  }

  function batchNotify(seneca, store, aggregateName) {
    store
      .ids()
      .filter(id => store.get(id).aggregateName === aggregateName)
      .forEach(id => {
        seneca.act({
          role: 'querychangeevent',
          queryId: id,
          batchUpdate: true
        });
      });
  }

  const createEventQueue = () => ({
    events: {},
    ensureAggregate(aggregateName) {
      if (!this.events[aggregateName]) this.events[aggregateName] = [];
    },
    queue(e) {
      this.ensureAggregate(e.aggregateName);
      this.events[e.aggregateName].push(e);
    },
    dequeue(aggregateName) {
      return this.events[aggregateName].shift();
    },
    eventCount(aggregateName) {
      return this.events[aggregateName] ? this.events[aggregateName].length : 0;
    },
    killQueue(aggregateName) {
      this.events[aggregateName] = [];
    },
    dequeueAll(aggregateName) {
      const result = this.events[aggregateName].reverse();
      this.killQueue(aggregateName);
      return result;
    },
    setLastEventTimestamp(aggregateName, stamp) {
      this.ensureAggregate(aggregateName);
      this.events[aggregateName].lastTimestamp = stamp;
    },
    getLastEventTimestamp(aggregateName) {
      this.ensureAggregate(aggregateName);
      return this.events[aggregateName].lastTimestamp;
    },
    setOldestEventTimestamp(aggregateName, stamp) {
      this.ensureAggregate(aggregateName);
      this.events[aggregateName].oldestEventTimestamp = stamp;
    },
    getOldestEventTimestamp(aggregateName) {
      this.ensureAggregate(aggregateName);
      return this.events[aggregateName].oldestEventTimestamp;
    },
    allAggregates() {
      return Object.getOwnPropertyNames(this.events);
    }
  });

  function loop(seneca, o, eventQueue) {
    eventQueue.allAggregates().forEach(agg => {
      const eventCount = eventQueue.eventCount(agg);
      if (eventCount > 0) {
        const stamp = Date.now();

        // checking is required when either the oldest event is too old by now
        // or when the newest event is a certain time ago
        const checkRequired =
          stamp - eventQueue.getOldestEventTimestamp(agg) > o.eventMaxAge ||
          stamp - eventQueue.getLastEventTimestamp(agg) > o.eventGapTime;

        if (checkRequired) {
          if (eventCount >= o.minimumBatchSize) {
            batchNotify(seneca, o.store, agg);
            eventQueue.killQueue(agg);
          } else {
            checkQueries(seneca, o.store, agg, eventQueue.dequeueAll(agg));
          }
        }
      }
    });

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

    const knownEvents = ['created', 'updated'];
    const knownAggregates = ['entity'];

    const eventQueue = createEventQueue();
    setTimeout(() => loop(this, o, eventQueue), o.loopDelay);

    this.add('role: event', function(m, r) {
      //console.log('Event received: ', m.event);
      if (
        knownEvents.includes(m.eventName) &&
        knownAggregates.includes(m.aggregateName)
      ) {
        const stamp = Date.now();
        eventQueue.setLastEventTimestamp(m.aggregateName, stamp);
        if (eventQueue.eventCount(m.aggregateName) == 0)
          eventQueue.setOldestEventTimestamp(m.aggregateName, stamp);

        eventQueue.queue({
          aggregateId: m.event.payload.data.id,
          aggregateName: m.aggregateName,
          eventName: m.eventName
        });
      }
      r();
    });
  };
})();
