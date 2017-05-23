/*const eventex = require('../eventex-fork/index');
const Launcher = require('../eventex-fork/src/serviceLauncher-seneca');
const Consumer = require('../eventex-fork/messageBus/consumer');
const Publisher = require('../eventex-fork/messageBus/publisher');
 */

/*
const senecaConfig = {
  hostname: process.env.RABBITMQ_HOST || 'rabbitmq',
  port: parseInt(process.env.RABBITMQ_PORT) || 5672,
  exchange: {
    name: 'cqrs_demo_events'
  }
};

const messageBusConfig = {
  provider: 'seneca',
  consumer: senecaConfig,
  publisher: senecaConfig
};

eventex.setMessageBus({
  consumer: new Consumer(messageBusConfig),
  publisher: new Publisher(messageBusConfig)
});

eventex.setEventStore({
  type: 'mongoDB',
  host: process.env.MONGO_HOST || 'mongo',
  port: process.env.MONGO_PORT || 27017,
  name: 'cqrs_demo_events',
  collectionName: 'events'
});

const context = eventex.defineContext('entities');

const aggregate = context.defineAggregate('entity', {
  date1: null,
  date2: null,
  int1: 0,
  int2: 0,
  string: ''
});

aggregate.defineCommand('create').emitDomainEvent('created').addValidation({
  date1: {
    type: 'object',
    required: true
  },
  date2: {
    type: 'object',
    required: true
  },
  int1: {
    type: 'number',
    required: true
  },
  int2: {
    type: 'number',
    required: true
  },
  string: {
    type: 'string',
    required: true
  }
});

aggregate
  .defineCommand('update')
  .emitDomainEvent('updated')
  .preCondition((data, aggregate) => {
    if (!aggregate.$isExists()) {
      console.error("Update error, entity doesn't exist");
      throw new Error("Update error, entity doesn't exist");
    }
  });

eventex.init(new Launcher(process.env.RABBITMQ_HOST || 'rabbitmq')).then(() => {
  console.info('Command Service started');
});
 */

const uuid = require('uuid/v4');
const Seneca = require('seneca');
const { fixObject } = require('../message-utils');
const busDriver = require('../resolve-bus-seneca');
const storeDriver = require('../resolve/packages/resolve-es-mongo').default;
const createBus = require('../resolve/packages/resolve-bus').default;
const createStore = require('../resolve/packages/resolve-es').default;
const commandHandler = require('../resolve/packages/resolve-command').default;

console.log('Createbus: ', JSON.stringify(createBus, null, 2));

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

      fixedCommand.aggregateId = fixedCommand.data.id || uuid();
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
