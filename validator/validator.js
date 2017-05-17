const fixObject = require('../message-utils').fixObject;

const parambulator = require('parambulator');

const valueSpec = {
  date1: {
    type$: 'date'
  },
  date2: {
    type$: 'date'
  },
  int1: {
    type$: 'integer'
  },
  int2: {
    type$: 'integer'
  },
  string: {
    type$: 'string'
  }
};

function getProps(spec) {
  return Object.getOwnPropertyNames(spec).filter(p => !p.endsWith('$'));
}

function includeOnly(spec, only) {
  return Object.assign({ only$: only }, spec);
}

function includeRequired(spec, required) {
  return Object.assign({ required$: required }, spec);
}

function createChecker(spec) {
  return parambulator(spec);
}

const valueChecker = createChecker(valueSpec);

const props = getProps(valueSpec);
const valueCheckerOnly = createChecker(includeOnly(valueSpec, props));
const valueSpecRequired = includeRequired(valueSpec, props);
const valueCheckerRequired = createChecker(valueSpecRequired);
const valueCheckerStrict = createChecker(includeOnly(valueSpecRequired, props));

module.exports = function(o) {
  this.add('role:validation, domain: values, cmd:validateOne', (m, r) => {
    m = fixObject(m);

    let checker = (() => {
      if (m.allowExtraFields) {
        return m.allowIncomplete ? valueChecker : valueCheckerRequired;
      } else {
        return m.allowIncomplete ? valueCheckerOnly : valueCheckerStrict;
      }
    })();

    checker.validate(m.instance, err => {
      if (err) {
        r(null, {
          valid: false,
          err$: err
        });
      } else {
        r(null, {
          valid: true
        });
      }
    });
  });
};
