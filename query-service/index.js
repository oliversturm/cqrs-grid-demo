require('babel-polyfill');
const seneca = require('seneca')();

seneca.use('query-values').listen({
  type: 'tcp',
  port: process.env.QRYSRVC_PORT || 3001,
  pin: 'role:entitiesQuery'
});
