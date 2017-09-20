const waitOn = require('wait-on');
const express = require('express');
const proxy = require('http-proxy-middleware');

const webProxy = `${process.env.WEB_PROXY_HOST || 'web-proxy'}:${process.env.WEB_PROXY_PORT || 3000}`;
const webProxyHttp = `http://${webProxy}`;

waitOn(
  {
    resources: [`tcp:${webProxy}`]
  },
  waitErr => {
    if (waitErr) {
      console.error('Error waiting for resources: ', waitErr);
      return;
    }

    var app = express();

    app.use(require('morgan')(process.env.DEPLOY ? 'combined' : 'dev'));
    app.use(express.static('static'));

    app.use(
      proxy('/data', {
        target: webProxyHttp
      })
    );
    app.use(
      proxy('/api', {
        target: webProxyHttp
      })
    );

    app.use(
      proxy(webProxyHttp, {
        ws: true
      })
    );

    const webAppPort = parseInt(process.env.WEBAPP_PORT) || 8080;

    app.listen(webAppPort, function() {
      console.log(`Web server running on port ${webAppPort}`);
    });
  }
);
