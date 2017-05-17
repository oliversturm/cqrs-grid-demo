const seneca = require('seneca')();
const uuid = require('uuid/v4');

seneca.use('seneca-amqp-transport').use(require('./events')).listen({
  type: 'amqp',
  hostname: process.env.RABBITMQ_HOST || 'rabbitmq',
  port: parseInt(process.env.RABBITMQ_PORT) || 5672,
  pin: 'role:event',
  name: 'readmodel_' + uuid(),
  socketOptions: {
    noDelay: true
  },
  exchange: {
    name: 'cqrs_demo_events',
    type: 'fanout'
  }
});
