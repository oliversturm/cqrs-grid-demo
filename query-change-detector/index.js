const waitOn = require('wait-on');
const seneca = require('seneca')();
const uuid = require('uuid/v4');

const store = require('./store')();

waitOn(
  {
    resources: [
      `tcp:${process.env.RABBITMQ_HOST || 'rabbitmq'}:${process.env.RABBITMQ_PORT || 5672}`
    ]
  },
  waitErr => {
    if (waitErr) {
      console.error('Error waiting for resources: ', waitErr);
      return;
    }

    seneca
      .use('seneca-amqp-transport')
      .use('./events', {
        store,
        idFieldName: '_id'
      })
      .use('querychanges', store)
      .listen({
        type: 'amqp',
        hostname: process.env.RABBITMQ_HOST || 'rabbitmq',
        port: parseInt(process.env.RABBITMQ_PORT) || 5672,
        pin: 'role:event',
        name: 'querychanges_' + uuid(),
        socketOptions: {
          noDelay: true
        },
        exchange: {
          name: 'cqrs_demo_events',
          type: 'fanout'
        }
      })
      .listen({
        type: 'amqp',
        hostname: process.env.RABBITMQ_HOST || 'rabbitmq',
        port: parseInt(process.env.RABBITMQ_PORT) || 5672,
        pin: 'role:querychanges',
        socketOptions: {
          noDelay: true
        }
      })
      .client({
        type: 'amqp',
        hostname: process.env.RABBITMQ_HOST || 'rabbitmq',
        port: parseInt(process.env.RABBITMQ_PORT) || 5672,
        pin: ['role: querychangeevent', 'role: entitiesQuery'],
        socketOptions: {
          noDelay: true
        }
      });
  }
);