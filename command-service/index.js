const eventex = require('../eventex-fork/index');
const Launcher = require('../eventex-fork/src/serviceLauncher-seneca');
const Consumer = require('../eventex-fork/messageBus/consumer');
const Publisher = require('../eventex-fork/messageBus/publisher');

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
