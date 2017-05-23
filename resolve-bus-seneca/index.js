const Seneca = require('seneca');
const uuid = require('uuid/v4');

function getConfig(config = {}) {
  config.type = 'amqp';
  if (!config.pin) config.pin = 'role:event';
  if (config.socketOptions) {
    if (config.socketOptions.noDelay === undefined) {
      config.socketOptions.noDelay = true;
    }
  } else
    config.socketOptions = {
      noDelay: true
    };
  if (config.exchange) {
    if (!config.exchange.name) config.exchange.name = 'resolve_events';
    if (!config.exchange.type) config.exchange.type = 'fanout';
  } else
    config.exchange = {
      name: 'resolve_events',
      type: 'fanout'
    };
  return config;
}

function getListenerConfig(config = {}) {
  config = getConfig(config);
  if (!config.name) config.name = 'resolveevent_' + uuid();
  return config;
}

function initClient(config) {
  return new Promise((resolve, reject) => {
    const seneca = Seneca();
    seneca.use('seneca-amqp-transport').client(config).ready(() => {
      resolve(seneca);
    });
  });
}

function initListener(config, handler) {
  return new Promise((resolve, reject) => {
    const seneca = Seneca();
    seneca
      .use('seneca-amqp-transport')
      .add('role:event', (m, r) => {
        handler(m.event);
        r();
      })
      .listen(config)
      .ready(() => {
        resolve(seneca);
      });
  });
}

module.exports = function(options) {
  let handler = () => {};
  const initClientPromise = initClient(getConfig(options));
  const initListenerPromise = initListener(getListenerConfig(options), event =>
    handler(event)
  );

  return {
    publish(event) {
      return initClientPromise.then(seneca => {
        seneca.act({
          role: 'event',
          eventName: event.type,
          aggregateName: event.payload.aggregateName,
          event
        });
      });
    },
    setTrigger(callback) {
      return initListenerPromise.then(() => (handler = callback));
    }
  };
};
