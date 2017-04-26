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

const context = eventex.defineContext('entities');

const aggregate = context.defineAggregate('entity', {
    date1: null,
    date2: null,
    int1: 0,
    int2: 0,
    string: ''
});

aggregate.defineCommand('create').emitDomainEvent('entityCreated');
aggregate.defineCommand('update').emitDomainEvent('entityUpdated');

eventex.init(new Launcher(process.env.RABBITMQ_HOST || 'rabbitmq')).then(() => {
    console.info('Command Service started');
});
