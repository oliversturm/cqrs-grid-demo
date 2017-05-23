const seneca = require('seneca')(
  {
    //log: "all"
  }
);

console.log('Using connection: ', process.env.CMDSRVC_HOST);

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
