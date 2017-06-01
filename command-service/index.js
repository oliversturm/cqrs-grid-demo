const Seneca = require('seneca');
const { fixObject } = require('../message-utils');
const busDriver = require('../resolve-bus-seneca');
const storeDriver = require('resolve-es-mongo');
const createBus = require('resolve-bus');
const createStore = require('resolve-es');
const commandHandler = require('resolve-command');

const bus = createBus({
  driver: busDriver({
    hostname: process.env.RABBITMQ_HOST || 'rabbitmq',
    port: parseInt(process.env.RABBITMQ_PORT) || 5672,
    exchange: {
      name: 'cqrs_demo_events'
    }
  })
});

const url = `mongodb://${process.env.MONGO_HOST || 'mongo'}:${process.env.MONGO_PORT || 27017}/${process.env.EVENTSDB_NAME || 'cqrs_events'}`;

const store = createStore({
  driver: storeDriver({
    url,
    collection: 'events'
  })
});

const aggregate = {
  name: 'Entity',
  commands: {
    create: (state, args) => {
      if (state && state.exists)
        throw new Error(`Aggregate already exists: ${JSON.stringify(args)}`);

      if (
        !args.aggregateId ||
        !args.data.date1 ||
        !args.data.date2 ||
        !args.data.int1 ||
        !args.data.int2 ||
        !args.data.string
      )
        throw new Error(
          `Can't create incomplete aggregate: ${JSON.stringify(args)}`
        );

      return {
        type: 'created',
        payload: args
      };
    },
    update: (state, args) => {
      if (!state.exists)
        throw new Error(
          `Can't update non-existing aggregate ${args.aggregateId}`
        );

      return {
        type: 'updated',
        payload: args
      };
    }
  },

  eventHandlers: {
    created: (state, args) => ({
      exists: true,
      id: args.aggregateId
    })
  }
};

const execute = commandHandler({
  store,
  bus,
  aggregates: [aggregate]
});

const seneca = Seneca();

seneca
  .use('seneca-amqp-transport')
  .add(
    {
      role: 'resolve',
      type: 'command'
    },
    (m, r) => {
      const fixedCommand = fixObject(seneca.util.clean(m));
      //console.log('Received command: ', JSON.stringify(fixedCommand, null, 2));

      // we assume an id is passed with the data - in my demo it doesn't really
      // make sense any other way, because my front-end REST service needs
      // to know the ids of new entities to return to the client.
      // Coming from the client, the id is expected to be part of the data
      // object because this comes from the readmodel database.
      // Of course it would be possible to implement alternative sources
      // of the aggregate id value if required.
      fixedCommand.aggregateId = fixedCommand.data.id;

      // my 'type' denotes that this is actually a command rather than a query
      // resolve expects the parameter named 'type' to reflect the name of
      // the command executed
      fixedCommand.type = fixedCommand.command;

      execute(fixedCommand)
        .catch(err => {
          console.error(err);
          r(null, {
            err$: err
          });
        })
        .then(() => {
          r();
        });
    }
  )
  .listen({
    type: 'amqp',
    hostname: process.env.RABBITMQ_HOST || 'rabbitmq',
    port: parseInt(process.env.RABBITMQ_PORT) || 5672,
    pin: 'role:resolve',
    socketOptions: {
      noDelay: true
    }
  });
