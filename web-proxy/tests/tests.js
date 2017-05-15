const chai = require('chai');
chai.use(require('chai-http'));
chai.use(require('chai-shallow-deep-equal'));

const expect = chai.expect;
const sinon = require('sinon');

const Seneca = require('seneca');

const web = require('seneca-web');
const express = require('express');
const bodyParser = require('body-parser');

const uuid = require('uuid/v4');

const routes = require('../routes');
const proxy = require('../proxy');

const BASE = '/data/v1/entity';

const val1 = {
  date1: new Date(),
  date2: new Date(),
  int1: 52,
  int2: 100,
  string: 'something'
};
const val2 = {
  date1: new Date(),
  date2: new Date(),
  int1: 62,
  int2: 100,
  string: 'something else'
};
const foo = [];

describe('REST tests', () => {
  function testServer(tdone, test, establishStubs, checkStubs) {
    const expressApp = express();

    // date reviving copied from https://github.com/expressjs/body-parser/issues/17
    var regexIso8601 = /^(\d{4}|\+\d{6})(?:-(\d{2})(?:-(\d{2})(?:T(\d{2}):(\d{2}):(\d{2})\.(\d{1,})(Z|([\-+])(\d{2}):(\d{2}))?)?)?)?$/;

    function reviveDates(key, value) {
      var match;
      if (typeof value === 'string' && (match = value.match(regexIso8601))) {
        var milliseconds = Date.parse(match[0]);
        if (!isNaN(milliseconds)) {
          return new Date(milliseconds);
        }
      }
      return value;
    }

    expressApp.use(
      bodyParser.json({
        reviver: reviveDates
      })
    );
    //expressApp.use(require("morgan")("dev"));

    var config = {
      routes: routes,
      adapter: require('seneca-web-adapter-express'),
      context: expressApp,
      options: {
        parseBody: false
      }
    };

    const seneca = Seneca({
      log: 'test'
    });
    require('seneca-stub')(seneca);

    seneca
      .test(tdone /* use this for test debugging */ /*, "print"*/)
      .use(proxy)
      .use(web, config)
      .ready(() => {
        const server = seneca.export('web/context')();
        const stubs = establishStubs(seneca);
        test(server, () => {
          checkStubs(stubs);
          seneca.close();
          tdone();
        });
      });
  }

  function resultStub(seneca, pin, result) {
    return seneca.stub(pin, function(m, r) {
      r(null, result);
    });
  }

  function validationStub(seneca, result) {
    return resultStub(seneca, 'role:validation,domain:entity,cmd:validateOne', {
      valid: result
    });
  }

  function emptyStub(seneca, pin) {
    return seneca.stub(pin, function(m, r) {
      r();
    });
  }

  describe('POST value', () => {
    it('should POST new value', tdone => {
      testServer(
        tdone,
        (server, ldone) => {
          chai.request(server).post(BASE).send(val1).end((err, res) => {
            console.log('server request done');
            expect(err).to.be.null;
            expect(res).to.have.status(201);
            expect(res).to.have.header('Location');
            ldone();
          });
        },
        seneca => {
          return {
            validationStub: validationStub(seneca, true),
            commandStub: emptyStub(
              seneca,
              'role:eventex,type:command,domain:entity,cmd:create'
            )
          };
        },
        stubs => {
          expect(stubs.validationStub.callCount).to.eql(1);
          expect(stubs.commandStub.callCount).to.eql(1);

          expect(stubs.validationStub.data()).to.shallowDeepEqual({
            role: 'validation',
            domain: 'entity',
            cmd: 'validateOne',
            instance: val1
          });

          const params = stubs.commandStub.data();
          expect(params.data).to.have.property('id');
          expect(params).to.shallowDeepEqual({
            role: 'eventex',
            type: 'command',
            domain: 'entity',
            cmd: 'create',
            data: val1
          });
        }
      );
    });

    it('POST should fail when validation fails', tdone => {
      testServer(
        tdone,
        (server, ldone) => {
          const newVal = {
            irrelevant: 'barg'
          };

          chai.request(server).post(BASE).send(newVal).end((err, res) => {
            expect(err).to.not.be.null;
            expect(res).to.have.status(400);
            ldone();
          });
        },
        seneca => {
          return {
            validationStub: validationStub(seneca, false),
            commandStub: emptyStub(
              seneca,
              'role:eventex,type:command,domain:entity,cmd:create'
            )
          };
        },
        stubs => {
          expect(stubs.validationStub.callCount).to.eql(1);
          expect(stubs.commandStub.callCount).to.eql(0);
        }
      );
    });
  });

  describe('PUT value', () => {
    it('changes a value', tdone => {
      const newVal = {
        int1: 52
      };
      testServer(
        tdone,
        (server, ldone) => {
          const location = BASE + '/' + uuid();

          chai
            .request(server)
            .put(location)
            .send(newVal)
            .then(res => {
              expect(res).to.have.status(204);
              ldone();
            })
            .catch(err => {
              throw err;
            });
        },
        seneca => {
          return {
            validationStub: validationStub(seneca, true),
            commandStub: emptyStub(
              seneca,
              'role:eventex,type:command,domain:entity,cmd:update'
            )
          };
        },
        stubs => {
          expect(stubs.validationStub.callCount).to.eql(1);
          expect(stubs.commandStub.callCount).to.eql(1);

          expect(stubs.validationStub.data()).to.shallowDeepEqual({
            role: 'validation',
            domain: 'entity',
            cmd: 'validateOne',
            instance: newVal,
            allowIncomplete: true
          });

          const params = stubs.commandStub.data();
          expect(params.data).to.have.property('id');
          expect(params).to.shallowDeepEqual({
            role: 'eventex',
            type: 'command',
            domain: 'entity',
            cmd: 'update',
            data: newVal
          });
        }
      );
    });

    it('should fail if validation fails', tdone => {
      testServer(
        tdone,
        (server, ldone) => {
          const newVal = {
            irrelevant: 'barg'
          };

          const location = BASE + '/' + uuid();

          chai.request(server).put(location).send(newVal).end((err, res) => {
            expect(err).to.not.be.null;
            expect(res).to.have.status(400);
            ldone();
          });
        },
        seneca => {
          return {
            validationStub: validationStub(seneca, false),
            commandStub: emptyStub(
              seneca,
              'role:eventex,type:command,domain:entity,cmd:update'
            )
          };
        },
        stubs => {
          expect(stubs.validationStub.callCount).to.eql(1);
          expect(stubs.commandStub.callCount).to.eql(0);
        }
      );
    });

    it('should fail on invalid id', tdone => {
      testServer(
        tdone,
        (server, ldone) => {
          const newVal = {
            int1: 52
          };

          const location = BASE + '/12345';

          chai.request(server).put(location).send(newVal).end((err, res) => {
            expect(res).to.have.status(404);
            ldone();
          });
        },
        seneca => {
          return {
            validationStub: validationStub(seneca, true),
            commandStub: emptyStub(
              seneca,
              'role:eventex,type:command,domain:entity,cmd:update'
            )
          };
        },
        stubs => {
          expect(stubs.validationStub.callCount).to.eql(0);
          expect(stubs.commandStub.callCount).to.eql(0);
        }
      );
    });
  });

  describe('GET value(s)', () => {
    it('retrieves all entities', tdone => {
      testServer(
        tdone,
        (server, ldone) => {
          chai
            .request(server)
            .get(BASE)
            .then(res => {
              expect(res).to.have.status(200);
              expect(res.body.data).to.be.a('array');
              expect(res.body.data).to.have.lengthOf(2);
              ldone();
            })
            .catch(err => {
              throw err;
            });
        },
        seneca => {
          return resultStub(
            seneca,
            'role:entitiesQuery,domain:entity,cmd:list',
            {
              data: [1, 2] // not important what's in the array
            }
          );
        },
        stub => {
          expect(stub.callCount).to.eql(1);

          expect(stub.data()).to.shallowDeepEqual({
            role: 'entitiesQuery',
            domain: 'entity',
            cmd: 'list',
            params: {}
          });
        }
      );
    });

    it('retrieves one value', tdone => {
      const id = uuid();

      testServer(
        tdone,
        (server, ldone) => {
          const location = BASE + '/' + id;

          chai
            .request(server)
            .get(location)
            .then(res => {
              expect(res).to.have.status(200);
              const o = res.body;
              expect(o).to.eql({
                result: 'all good'
              });

              ldone();
            })
            .catch(err => {
              throw err;
            });
        },
        seneca => {
          return resultStub(
            seneca,
            'role:entitiesQuery,domain:entity,cmd:fetch',
            {
              result: 'all good'
            }
          );
        },
        stub => {
          expect(stub.callCount).to.eql(1);

          expect(stub.data()).to.shallowDeepEqual({
            role: 'entitiesQuery',
            domain: 'entity',
            cmd: 'fetch',
            id
          });
        }
      );
    });

    it('GET should fail on invalid id', tdone => {
      testServer(
        tdone,
        (server, ldone) => {
          chai.request(server).get(BASE + '/12345').end((err, res) => {
            expect(res).to.have.status(404);
            ldone();
          });
        },
        seneca => {
          return emptyStub(
            seneca,
            'role:entitiesQuery,domain:entity,cmd:fetch'
          );
        },
        stub => {
          expect(stub.callCount).to.eql(0);
        }
      );
    });
  });
});
