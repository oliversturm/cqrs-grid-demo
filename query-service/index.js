const waitOn = require('wait-on');
require('babel-polyfill');
const seneca = require('seneca')();

waitOn(
  {
    resources: [
      `tcp:${process.env.MONGO_HOST || 'mongo'}:${process.env.MONGO_PORT || 27017}`
    ]
  },
  waitErr => {
    if (waitErr) {
      console.error('Error waiting for resources: ', waitErr);
      return;
    }
    seneca.use('query-values').listen({
      type: 'tcp',
      port: process.env.QRYSRVC_PORT || 3001,
      pin: 'role:entitiesQuery'
    });
  }
);
