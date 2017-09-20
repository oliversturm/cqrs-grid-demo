const waitOn = require('wait-on');
const seneca = require('seneca')();

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
    seneca
      .use('seneca-amqp-transport')
      .use('query-values')
      .use('query-events')
      .listen({
        type: 'amqp',
        hostname: process.env.RABBITMQ_HOST || 'rabbitmq',
        port: parseInt(process.env.RABBITMQ_PORT) || 5672,
        pin: 'role:entitiesQuery',
        socketOptions: {
          noDelay: true
        }
      });
  }
);
