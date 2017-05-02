module.exports = [
  {
    pin: 'role:web,domain:values,cmd:*',
    prefix: '/data/v1/values',
    map: {
      list: {
        GET: true,
        name: ''
      },
      create: {
        POST: true,
        name: '',
        autoreply: false
      },
      fetch: {
        GET: true,
        name: '',
        suffix: '/:id',
        autoreply: false
      },
      update: {
        PUT: true,
        name: '',
        suffix: '/:id',
        autoreply: false
      },
      delete: {
        DELETE: true,
        name: '',
        suffix: '/:id',
        autoreply: false
      }
    }
  },
  {
    pin: 'role:web,domain:events,cmd:*',
    prefix: '/data/v1/events',
    map: {
      list: {
        GET: true,
        name: ''
      },
      fetch: {
        GET: true,
        name: '',
        suffix: '/:id',
        autoreply: false
      }
    }
  },
  {
    pin: 'role:web,domain:values,cmd:*',
    prefix: '/api/v1',
    map: {
      createTestData: {
        GET: true
      }
    }
  }
];
