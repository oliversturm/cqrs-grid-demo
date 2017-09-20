const waitOn = require('wait-on');
const seneca = require('seneca')(
  {
    //log: "all"
  }
);

waitOn(
  {
    resources: [
      `tcp:${process.env.MONGO_HOST || 'mongo'}:${process.env.MONGO_PORT || 27017}`,
      `tcp:${process.env.VALSRVC_HOST || 'validator'}:${process.env.VALSRVC_PORT || 3003}`
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
        host: process.env.VALSRVC_HOST || 'validator',
        port: process.env.VALSRVC_PORT || 3003,
        pin: 'role:validation'
      })
      .use('command-values')
      .listen({
        type: 'tcp',
        port: process.env.CMDSRVC_PORT || 3002,
        pin: 'role:entitiesCommand'
      });
  }
);
