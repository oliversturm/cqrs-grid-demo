const waitOn = require('wait-on');
const seneca = require('seneca')();

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
      .client({
        type: 'amqp',
        hostname: process.env.RABBITMQ_HOST || 'rabbitmq',
        port: parseInt(process.env.RABBITMQ_PORT) || 5672,
        pin: 'role:resolve',
        socketOptions: {
          noDelay: true
        }
      })
      .use('testing')
      .listen({
        type: 'amqp',
        hostname: process.env.RABBITMQ_HOST || 'rabbitmq',
        port: parseInt(process.env.RABBITMQ_PORT) || 5672,
        pin: 'role:testing',
        socketOptions: {
          noDelay: true
        }
      });
  }
);
