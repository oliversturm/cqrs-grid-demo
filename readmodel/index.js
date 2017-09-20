const waitOn = require('wait-on');
const seneca = require('seneca')();
const uuid = require('uuid/v4');

waitOn(
  {
    resources: [
      `tcp:${process.env.RABBITMQ_HOST || 'rabbitmq'}:${process.env.RABBITMQ_PORT || 5672}`,
      `tcp:${process.env.MONGO_HOST || 'mongo'}:${process.env.MONGO_PORT || 27017}`
    ]
  },
  waitErr => {
    if (waitErr) {
      console.error('Error waiting for resources: ', waitErr);
      return;
    }
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
  }
);
