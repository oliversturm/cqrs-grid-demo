const waitOn = require('wait-on');
const seneca = require('seneca')();
const web = require('seneca-web');
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const socketIo = require('socket.io');
const http = require('http');

const routes = require('./routes');

const messageUtils = require('../message-utils');
const fixValue = messageUtils.fixValue;
const fixDate = messageUtils.fixDate;

const liveClients = require('./liveClients.js')();

function revive(key, value) {
  return fixValue(value, [fixDate]);
}

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

    const expressApp = express();

    expressApp.use(
      bodyParser.json({
        reviver: revive
      })
    );
    expressApp.use(cors());

    expressApp.use(require('morgan')('dev'));

    const config = {
      routes: routes,
      adapter: require('seneca-web-adapter-express'),
      context: expressApp,
      options: {
        parseBody: false
      }
    };

    seneca
      .use('seneca-amqp-transport')
      .use('proxy', liveClients)
      .use('queryChanges', liveClients)
      .client({
        type: 'amqp',
        hostname: process.env.RABBITMQ_HOST || 'rabbitmq',
        port: parseInt(process.env.RABBITMQ_PORT) || 5672,
        pin: [
          'role:entitiesQuery',
          'role:entitiesCommand',
          'role:validation',
          'role:testing',
          'role:resolve',
          'role:querychanges'
        ],
        socketOptions: {
          noDelay: true
        }
      })
      .listen({
        type: 'amqp',
        hostname: process.env.RABBITMQ_HOST || 'rabbitmq',
        port: parseInt(process.env.RABBITMQ_PORT) || 5672,
        pin: 'role:querychangeevent',
        socketOptions: {
          noDelay: true
        }
      })
      .use(web, config)
      .ready(() => {
        const express = seneca.export('web/context')();
        const server = http.Server(express);
        const io = socketIo(server);
        require('./sockets')(seneca, io, liveClients);

        const port = process.env.WEBPROXY_PORT || 3000;

        server.listen(port, () => {
          console.log('Web Proxy running on port ' + port);
        });
      });
  }
);
