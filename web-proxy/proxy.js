const mongodb = require('mongodb');
const ObjectID = mongodb.ObjectID;
const parambulator = require('parambulator');

const messageUtils = require('../message-utils');
const fixObject = messageUtils.fixObject;

function sendErrorStatus(m, status, msg = '') {
  //    console.log("Sending error status '" + status + "': ", msg);

  m.response$.status(status).send({
    message: msg
  });
}

const errors = {
  invalid: {
    status: 400,
    message: 'Invalid data'
  },
  unknownid: {
    status: 404,
    message: 'Invalid ID'
  }
};

function checkError(m, res) {
  if (res && res.err$) {
    const details = errors[res.err$];
    if (details) sendErrorStatus(m, details.status, details.message);
    else sendErrorStatus(m, 500);
    return true;
  }
  return false;
}

module.exports = function(o) {
  this.add('role:web, domain:values, cmd:createTestData', (m, r) => {
    console.log('proxy creating test data');

    this.act(
      {
        role: 'testing',
        domain: 'values',
        cmd: 'createTestData',
        count: m.args.query.count
      },
      r
    );
  });

  const sortOptionsChecker = parambulator({
    required$: ['desc', 'selector'],
    // isExpanded doesn't make any sense with sort, but the grid seems
    // to include it occasionally - probably a bug
    only$: ['desc', 'selector', 'isExpanded'],
    desc: {
      type$: 'boolean'
    },
    selector: {
      type$: 'string'
    }
  });

  const groupOptionsChecker = parambulator({
    required$: ['selector'],
    only$: ['desc', 'selector', 'isExpanded', 'groupInterval'],
    desc: {
      type$: 'boolean'
    },
    isExpanded: {
      type$: 'boolean'
    },
    selector: {
      type$: 'string'
    },
    groupInterval: {
      type$: ['string', 'integer']
      // unclear whether parambulator supports a spec that says "can be enum but also number"
      //enum$: [ "year", "quarter", "month", "day", "dayOfWeek", "hour", "minute", "second" ] // and numbers?
    }
  });

  const summaryOptionsChecker = parambulator({
    required$: ['summaryType'],
    only$: ['summaryType', 'selector'],
    summaryType: {
      enum$: ['sum', 'avg', 'min', 'max', 'count']
    },
    selector: {
      type$: 'string'
    }
  });

  function validateAll(list, checker, short = true) {
    return list.reduce(
      (r, v) => {
        if (short && !r.valid) return r; // short circuiting
        const newr = checker.validate(v);
        if (newr) {
          r.errors.push(newr);
          r.valid = false;
        }
        return r;
      },
      { valid: true, errors: [] }
    );
  }

  function parseOrFix(arg) {
    return typeof arg === 'string'
      ? JSON.parse(arg)
      : fixObject(arg, messageUtils.defaultFixers.concat(messageUtils.fixBool));
  }

  this.add('role:web, domain:values, cmd:list', function(m, r) {
    let p = {};

    console.log('Received query: ', JSON.stringify(m.args.query));

    if (m.args.query.take) {
      const take = parseInt(m.args.query.take);
      if (take > 0) p.take = take;
      else this.log.info('Invalid take parameter found', m.args.query.take);
    }

    if (m.args.query.skip) {
      const skip = parseInt(m.args.query.skip);
      if (skip >= 0) p.skip = skip;
      else this.log.info('Invalid skip parameter found', m.args.query.skip);
    }

    p.requireTotalCount = m.args.query.requireTotalCount === 'true';

    if (m.args.query.sort) {
      const sortOptions = parseOrFix(m.args.query.sort);

      if (sortOptions instanceof Array && sortOptions.length > 0) {
        const vr = validateAll(sortOptions, sortOptionsChecker);
        if (vr.valid) p.sort = sortOptions;
        else this.log.info('Sort parameter validation errors', vr.errors);
      } else this.log.info('Invalid sort parameter found', m.args.query.sort);
    }

    if (m.args.query.group) {
      const groupOptions = parseOrFix(m.args.query.group);

      if (groupOptions instanceof Array) {
        if (groupOptions.length > 0) {
          const vr = validateAll(groupOptions, groupOptionsChecker);
          if (vr.valid) {
            p.group = groupOptions;

            p.requireGroupCount = m.args.query.requireGroupCount === 'true';

            if (m.args.query.groupSummary) {
              const gsOptions = parseOrFix(m.args.query.groupSummary);

              if (gsOptions instanceof Array) {
                if (gsOptions.length > 0) {
                  const vr = validateAll(gsOptions, summaryOptionsChecker);
                  if (vr.valid) p.groupSummary = gsOptions;
                  else
                    this.log.info(
                      'groupSummary parameter validation errors',
                      vr.errors
                    );
                }
                // else - ignore empty array
              } else
                this.log.info(
                  'Invalid groupSummary parameter found',
                  m.args.query.groupSummary
                );
            }
          } else this.log.info('Group parameter validation errors', vr.errors);
        }
        // else - ignore empty array
      } else this.log.info('Invalid group parameter found', m.args.query.group);
    }

    if (m.args.query.totalSummary) {
      const tsOptions = parseOrFix(m.args.query.totalSummary);

      if (tsOptions instanceof Array) {
        if (tsOptions.length > 0) {
          const vr = validateAll(tsOptions, summaryOptionsChecker);
          if (vr.valid) p.totalSummary = tsOptions;
          else
            this.log.info(
              'totalSummary parameter validation errors',
              vr.errors
            );
        }
        // else - ignore empty array
      } else
        this.log.info(
          'Invalid totalSummary parameter found',
          m.args.query.totalSummary
        );
    }

    if (m.args.query.filter) {
      // keeping validation basic here - the structure is probably
      // an array of elements and nested arrays
      // the query service uses it if it can and returns errors
      // otherwise
      const filterOptions = parseOrFix(m.args.query.filter);
      if (typeof filterOptions === 'string' || filterOptions.length) {
        p.filter = filterOptions;
      } else
        this.log.info('Invalid filter parameter found', m.args.query.filter);
    }

    if (
      m.args.query.searchExpr &&
      m.args.query.searchOperation &&
      m.args.query.searchValue
    ) {
      const searchValue = parseOrFix(m.args.query.searchValue);
      const searchOperation = parseOrFix(m.args.query.searchOperation);
      const searchExpr = parseOrFix(m.args.query.searchExpr);
      if (
        typeof searchValue === 'string' &&
        typeof searchValue === 'string' &&
        (typeof searchExpr === 'string' || searchExpr.length)
      ) {
        p.searchValue = searchValue;
        p.searchOperation = searchOperation;
        p.searchExpr = searchExpr;
      }
    }

    if (m.args.query.select) {
      const selectOptions = parseOrFix(m.args.query.select);
      if (typeof selectOptions === 'string') p.select = [selectOptions];
      else if (selectOptions.length > 0) {
        if (selectOptions.reduce((r, v) => r && typeof v === 'string', true))
          p.select = selectOptions;
        else
          this.log.info(
            'Array-like select parameter found with invalid content'
          );
      } else this.log.info('Unknown type for select parameter');
    }

    let timezoneOffset = 0;
    let summaryQueryLimit = undefined;

    if (m.args.query.tzOffset) timezoneOffset = parseInt(m.args.query.tzOffset);
    if (m.args.query.summaryQueryLimit)
      summaryQueryLimit = parseInt(m.args.query.summaryQueryLimit);

    this.act(
      {
        role: 'entitiesQuery',
        domain: 'values',
        cmd: 'list',
        timezoneOffset,
        summaryQueryLimit,
        params: p
      },
      r
    );
  });

  this.add('role:web, domain:values, cmd:create', function(m, r) {
    const seneca = this;
    const instance = m.args.body;

    // not fixing object - we'll just pass it on
    seneca.act(
      {
        role: 'validation',
        domain: 'values',
        cmd: 'validateOne',
        instance: instance
      },
      (err, res) => {
        if (err) r(err);

        if (!res.valid) {
          sendErrorStatus(m, 400, res.err$);
          return r();
        }

        return seneca.act(
          {
            role: 'entitiesCommand',
            domain: 'values',
            cmd: 'create',
            instance: instance
          },
          function(err, res) {
            if (err) return r(err);
            if (checkError(m, res)) return r();

            m.response$.location('/data/v1/values/' + res.id);
            m.response$.sendStatus(201);

            return r();
          }
        );
      }
    );
  });

  this.add('role:web, domain:values, cmd:fetch', function(m, r) {
    const seneca = this;
    const id = m.args.params.id;

    if (!ObjectID.isValid(id)) {
      sendErrorStatus(m, 404, 'Invalid ID');
      return r();
    }

    return seneca.act(
      {
        role: 'entitiesQuery',
        domain: 'values',
        cmd: 'fetch',
        id: id
      },
      function(err, res) {
        if (err) return r(err);
        if (checkError(m, res)) return r();

        m.response$.status(200).send(res);
        return r();
      }
    );
  });

  this.add('role:web, domain:values, cmd:update', function(m, r) {
    const seneca = this;
    const id = m.args.params.id;

    // not fixing object - we'll just pass it on

    if (!ObjectID.isValid(id)) {
      sendErrorStatus(m, 404, 'Invalid ID');
      return r();
    }

    const instance = m.args.body;

    return seneca.act(
      {
        role: 'entitiesCommand',
        domain: 'values',
        cmd: 'update',
        id: id,
        instance: instance
      },
      function(err, res) {
        if (err) return r(err);
        if (checkError(m, res)) return r();

        m.response$.sendStatus(204);
        return r();
      }
    );
  });
};
