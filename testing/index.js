const waitOn = require('wait-on');
const seneca = require('seneca')(
  {
    //log: "all"
  }
);

waitOn(
  {
    resources: [
      `tcp:${process.env.CMDSRVC_HOST || 'command-service'}:${process.env.CMDSRVC_PORT || 3002}`
    ]
  },
  waitErr => {
    if (waitErr) {
      console.error('Error waiting for resources: ', waitErr);
      return;
    }

    seneca
      .client({
        type: 'tcp',
        // expecting "command-service" to be available
        // as a docker link
        host: process.env.CMDSRVC_HOST || 'command-service',
        port: process.env.CMDSRVC_PORT || 3002,
        pin: 'role:entitiesCommand'
      })
      .use('testing')
      .listen({
        type: 'tcp',
        port: process.env.TESTSRVC_PORT || 3005,
        pin: 'role:testing'
      });
  }
);
