const express = require('express');
const proxy = require('http-proxy-middleware');

var app = express();

app.use(require('morgan')(process.env.DEPLOY ? 'combined' : 'dev'));
app.use(express.static('static'));

app.use(
  proxy('/data', {
    target: 'http://web-proxy:3000'
  })
);
app.use(
  proxy('/api', {
    target: 'http://web-proxy:3000'
  })
);

app.use(
  proxy('http://web-proxy:3000', {
    ws: true
  })
);

app.listen(8080, function() {
  console.log('Web server running on port 8080');
});
