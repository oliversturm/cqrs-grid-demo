const fixObject = require('../message-utils').fixObject;

const parambulator = require('parambulator');

const entitySpec = {
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

const entityChecker = createChecker(entitySpec);

const props = getProps(entitySpec);
const entityCheckerOnly = createChecker(includeOnly(entitySpec, props));
const entitySpecRequired = includeRequired(entitySpec, props);
const entityCheckerRequired = createChecker(entitySpecRequired);
const entityCheckerStrict = createChecker(
  includeOnly(entitySpecRequired, props)
);

module.exports = function(o) {
  this.add('role:validation, domain: entity, cmd:validateOne', (m, r) => {
    m = fixObject(m);

    let checker = (() => {
      if (m.allowExtraFields) {
        return m.allowIncomplete ? entityChecker : entityCheckerRequired;
      } else {
        return m.allowIncomplete ? entityCheckerOnly : entityCheckerStrict;
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
