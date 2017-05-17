const expect = require('chai').expect;
const Seneca = require('seneca');

const TESTRECORD_COUNT = 100;

function testQueryValues(
  tdone,
  test,
  dropAndGenerate = true,
  dbname = 'valuedb_test'
) {
  const db = require('../../db')({
    mongoHost: 'localhost',
    mongoDbName: dbname
  });

  function addDays(date, days) {
    date.setDate(date.getDate() + days);
    return date;
  }

  db(db => {
    function runTest() {
      const seneca = Seneca({
        log: 'test'
      });

      seneca
        .test(tdone /* use this for test debugging */ /*, "print"*/)
        .use(require('../query-values'), {
          connectedDb: db
        })
        .ready(() => {
          test(seneca, () => {
            seneca.close();
            db.close();
            tdone();
          });
        });
    }

    if (dropAndGenerate) {
      db.dropDatabase((err, res) => {
        const values = db.collection('values');
        const currentYear = new Date().getFullYear();
        const currentYearStart = () => new Date(currentYear, 0, 1);
        const nextYearStart = () => new Date(currentYear + 1, 0, 1);

        Promise.all(
          Array.from(new Array(TESTRECORD_COUNT), (v, i) => i + 1).map(n =>
            values.insertOne({
              date1: addDays(currentYearStart(), n),
              date2: addDays(nextYearStart(), n),
              int1: n % 10,
              int2: n % 5,
              string: 'Item ' + n
            })
          )
        ).then(runTest);
      });
    } else {
      runTest();
    }
  });
}

describe('query-values', function() {
  describe('#entitiesQuery.values', function() {
    it('list should retrieve all entities', function(tdone) {
      testQueryValues(tdone, (seneca, ldone) => {
        seneca.act(
          {
            role: 'entitiesQuery',
            domain: 'values',
            cmd: 'list',
            params: {
              requireTotalCount: true
            }
          },
          function(err, res) {
            expect(err, 'err').to.be.null;
            expect(res.err$, 'err$').to.be.undefined;
            expect(res.totalCount, 'totalCount').to.eql(TESTRECORD_COUNT);

            expect(res.data, 'res.data').to.be.instanceof(Array);
            expect(res.data, 'result').to.have.lengthOf(TESTRECORD_COUNT);
            ldone();
          }
        );
      });
    });

    it('fetch should retrieve one entity by id', function(tdone) {
      testQueryValues(tdone, (seneca, ldone) => {
        seneca.act(
          {
            role: 'entitiesQuery',
            domain: 'values',
            cmd: 'list'
          },
          function(err, res) {
            expect(err, 'listerr').to.be.null;
            const testObject = res.data[0];
            seneca.act(
              {
                role: 'entitiesQuery',
                domain: 'values',
                cmd: 'fetch',
                id: testObject._id
              },
              function(err, res) {
                expect(err, 'err').to.be.null;
                expect(res.err$, 'err$').to.be.undefined;
                expect(res, 'result').to.eql(testObject);

                ldone();
              }
            );
          }
        );
      });
    });

    it('list should accept skip', function(tdone) {
      testQueryValues(tdone, (seneca, ldone) => {
        seneca.act(
          {
            role: 'entitiesQuery',
            domain: 'values',
            cmd: 'list',
            params: {
              skip: 5,
              requireTotalCount: true
            }
          },
          function(err, res) {
            expect(err, 'err').to.be.null;
            expect(res.err$, 'err$').to.be.undefined;
            expect(res.totalCount).to.eql(TESTRECORD_COUNT);

            expect(res.data, 'res.data').to.be.instanceof(Array);
            expect(res.data, 'result').to.have.lengthOf(TESTRECORD_COUNT - 5);
            ldone();
          }
        );
      });
    });

    it('list should accept take', function(tdone) {
      testQueryValues(tdone, (seneca, ldone) => {
        seneca.act(
          {
            role: 'entitiesQuery',
            domain: 'values',
            cmd: 'list',
            params: {
              take: 5,
              requireTotalCount: true
            }
          },
          function(err, res) {
            expect(err, 'err').to.be.null;
            expect(res.err$, 'err$').to.be.undefined;
            expect(res.totalCount).to.eql(TESTRECORD_COUNT);

            expect(res.data, 'res.data').to.be.instanceof(Array);
            expect(res.data, 'result').to.have.lengthOf(5);
            ldone();
          }
        );
      });
    });

    it('list should sort ascending', function(tdone) {
      testQueryValues(tdone, (seneca, ldone) => {
        seneca.act(
          {
            role: 'entitiesQuery',
            domain: 'values',
            cmd: 'list',
            params: {
              take: 5,
              sort: [
                {
                  selector: 'int1',
                  desc: false
                }
              ]
            }
          },
          function(err, res) {
            expect(err, 'err').to.be.null;
            expect(res.err$, 'err$').to.be.undefined;

            expect(res.data, 'res.data').to.be.instanceof(Array);
            expect(res.data, 'result').to.have.lengthOf(5);
            expect(res.data[0].int1).to.eql(0);
            expect(res.data[1].int1).to.eql(0);
            expect(res.data[2].int1).to.eql(0);
            expect(res.data[3].int1).to.eql(0);
            expect(res.data[4].int1).to.eql(0);

            ldone();
          }
        );
      });
    });

    it('list should sort descending', function(tdone) {
      testQueryValues(tdone, (seneca, ldone) => {
        seneca.act(
          {
            role: 'entitiesQuery',
            domain: 'values',
            cmd: 'list',
            params: {
              take: 5,
              sort: [
                {
                  selector: 'int1',
                  desc: true
                }
              ]
            }
          },
          function(err, res) {
            expect(err, 'err').to.be.null;
            expect(res.err$, 'err$').to.be.undefined;

            expect(res.data, 'res.data').to.be.instanceof(Array);
            expect(res.data, 'result').to.have.lengthOf(5);
            expect(res.data[0].int1).to.eql(9);
            expect(res.data[1].int1).to.eql(9);
            expect(res.data[2].int1).to.eql(9);
            expect(res.data[3].int1).to.eql(9);
            expect(res.data[4].int1).to.eql(9);

            ldone();
          }
        );
      });
    });

    it('list should filter with =', function(tdone) {
      testQueryValues(tdone, (seneca, ldone) => {
        seneca.act(
          {
            role: 'entitiesQuery',
            domain: 'values',
            cmd: 'list',
            params: {
              filter: ['int1', '=', 3],
              requireTotalCount: true
            }
          },
          function(err, res) {
            expect(err, 'err').to.be.null;
            expect(res.err$, 'err$').to.be.undefined;
            expect(res.totalCount, 'totalCount').to.eql(10);

            expect(res.data, 'res.data').to.be.instanceof(Array);
            expect(res.data, 'list length').to.have.lengthOf(10);
            ldone();
          }
        );
      });
    });

    it('list should filter with multiple criteria', function(tdone) {
      testQueryValues(tdone, (seneca, ldone) => {
        seneca.act(
          {
            role: 'entitiesQuery',
            domain: 'values',
            cmd: 'list',
            params: {
              filter: [['int1', '=', 3], 'or', ['int1', '=', 5]],
              requireTotalCount: true
            }
          },
          function(err, res) {
            expect(err, 'err').to.be.null;
            expect(res.err$, 'err$').to.be.undefined;
            expect(res.totalCount, 'totalCount').to.eql(20);

            expect(res.data, 'res.data').to.be.instanceof(Array);
            expect(res.data, 'list length').to.have.lengthOf(20);
            ldone();
          }
        );
      });
    });

    it('list should search with =', function(tdone) {
      testQueryValues(tdone, (seneca, ldone) => {
        seneca.act(
          {
            role: 'entitiesQuery',
            domain: 'values',
            cmd: 'list',
            params: {
              searchExpr: 'int1',
              searchOperation: '=',
              searchValue: 3,
              requireTotalCount: true
            }
          },
          function(err, res) {
            expect(err, 'err').to.be.null;
            expect(res.err$, 'err$').to.be.undefined;
            expect(res.totalCount, 'totalCount').to.eql(10);

            expect(res.data, 'res.data').to.be.instanceof(Array);
            expect(res.data, 'list length').to.have.lengthOf(10);
            ldone();
          }
        );
      });
    });

    it('list should project with select', function(tdone) {
      testQueryValues(tdone, (seneca, ldone) => {
        seneca.act(
          {
            role: 'entitiesQuery',
            domain: 'values',
            cmd: 'list',
            params: {
              filter: ['int1', '=', 3],
              requireTotalCount: false,
              select: ['int2', 'date1']
            }
          },
          function(err, res) {
            //console.log("Result: ", JSON.stringify(res, null, 2));

            expect(err, 'err').to.be.null;
            expect(res.err$, 'err$').to.be.undefined;

            expect(res.data[0]).to.have.ownProperty('_id');
            expect(res.data[0]).to.have.ownProperty('int2');
            expect(res.data[0]).to.have.ownProperty('date1');

            expect(res.data[0]).to.not.have.ownProperty('int1');
            expect(res.data[0]).to.not.have.ownProperty('date2');
            expect(res.data[0]).to.not.have.ownProperty('string');

            ldone();
          }
        );
      });
    });

    it('list should search with multiple fields', function(tdone) {
      testQueryValues(tdone, (seneca, ldone) => {
        seneca.act(
          {
            role: 'entitiesQuery',
            domain: 'values',
            cmd: 'list',
            params: {
              searchExpr: ['int1', 'int2'],
              searchOperation: '=',
              searchValue: 3,
              requireTotalCount: true
            }
          },
          function(err, res) {
            //console.log("Result: ", JSON.stringify(res, null, 2));

            expect(err, 'err').to.be.null;
            expect(res.err$, 'err$').to.be.undefined;
            expect(res.totalCount, 'totalCount').to.eql(20);

            expect(res.data, 'res.data').to.be.instanceof(Array);
            expect(res.data, 'list length').to.have.lengthOf(20);
            ldone();
          }
        );
      });
    });

    it('list should filter with <', function(tdone) {
      testQueryValues(tdone, (seneca, ldone) => {
        seneca.act(
          {
            role: 'entitiesQuery',
            domain: 'values',
            cmd: 'list',
            params: {
              filter: ['int1', '<', 5],
              requireTotalCount: true
            }
          },
          function(err, res) {
            expect(err, 'err').to.be.null;
            expect(res.err$, 'err$').to.be.undefined;
            expect(res.totalCount, 'totalCount').to.eql(50);

            expect(res.data, 'res.data').to.be.instanceof(Array);
            expect(res.data, 'list length').to.have.lengthOf(50);
            ldone();
          }
        );
      });
    });

    it('list should filter with endswith', function(tdone) {
      testQueryValues(tdone, (seneca, ldone) => {
        seneca.act(
          {
            role: 'entitiesQuery',
            domain: 'values',
            cmd: 'list',
            params: {
              filter: ['string', 'endswith', '23'],
              requireTotalCount: true
            }
          },
          function(err, res) {
            expect(err, 'err').to.be.null;
            expect(res.err$, 'err$').to.be.undefined;
            expect(res.totalCount, 'totalCount').to.eql(1);

            expect(res.data, 'res.data').to.be.instanceof(Array);
            expect(res.data, 'list length').to.have.lengthOf(1);
            ldone();
          }
        );
      });
    });

    it('list should filter with endswith, no results', function(tdone) {
      testQueryValues(tdone, (seneca, ldone) => {
        seneca.act(
          {
            role: 'entitiesQuery',
            domain: 'values',
            cmd: 'list',
            params: {
              filter: ['string', 'endswith', "something that doesn't exist"],
              requireTotalCount: true
            }
          },
          function(err, res) {
            expect(err, 'err').to.be.null;
            expect(res.err$, 'err$').to.be.undefined;
            expect(res.totalCount, 'totalCount').to.eql(0);

            expect(res.data, 'res.data').to.be.instanceof(Array);
            expect(res.data, 'list length').to.have.lengthOf(0);
            ldone();
          }
        );
      });
    });

    it('list should filter with endswith, no results, total summary defined', function(
      tdone
    ) {
      testQueryValues(tdone, (seneca, ldone) => {
        seneca.act(
          {
            role: 'entitiesQuery',
            domain: 'values',
            cmd: 'list',
            params: {
              filter: ['string', 'endswith', "something that doesn't exist"],
              totalSummary: [
                {
                  selector: 'int1',
                  summaryType: 'sum'
                }
              ],
              requireTotalCount: true
            }
          },
          function(err, res) {
            expect(err, 'err').to.be.null;
            expect(res.err$, 'err$').to.be.undefined;
            expect(res.totalCount, 'totalCount').to.eql(0);

            expect(res.data, 'res.data').to.be.instanceof(Array);
            expect(res.data, 'list length').to.have.lengthOf(0);

            expect(res.summary, 'res.summary').to.be.undefined;

            ldone();
          }
        );
      });
    });

    it('list should calculate total summaries for simple queries', function(
      tdone
    ) {
      testQueryValues(tdone, (seneca, ldone) => {
        seneca.act(
          {
            role: 'entitiesQuery',
            domain: 'values',
            cmd: 'list',
            params: {
              filter: ['int1', '<', 5],
              totalSummary: [
                {
                  selector: 'int1',
                  summaryType: 'sum'
                },
                {
                  selector: 'int2',
                  summaryType: 'max'
                }
              ],
              requireTotalCount: true
            }
          },
          function(err, res) {
            expect(err, 'err').to.be.null;
            expect(res.err$, 'err$').to.be.undefined;
            expect(res.totalCount, 'totalCount').to.eql(50);

            expect(res.summary, 'res.summary').to.be.instanceof(Array);
            expect(res.summary, 'res.summary').to.have.lengthOf(2);
            expect(res.summary[0], 'sum(int1)').to.eql(100);
            expect(res.summary[1], 'max(int2)').to.eql(4);

            ldone();
          }
        );
      });
    });

    it('list should group with items', function(tdone) {
      testQueryValues(tdone, (seneca, ldone) => {
        seneca.act(
          {
            role: 'entitiesQuery',
            domain: 'values',
            cmd: 'list',
            params: {
              group: [
                {
                  selector: 'int1',
                  desc: false,
                  isExpanded: true
                }
              ],
              requireTotalCount: true,
              requireGroupCount: true
            }
          },
          function(err, res) {
            expect(err, 'err').to.be.null;
            expect(res.err$, 'err$').to.be.undefined;

            expect(res.totalCount, 'totalCount').to.eql(TESTRECORD_COUNT);
            expect(res.groupCount, 'groupCount').to.eql(10);

            expect(res.data, 'res.data').to.be.instanceof(Array);
            expect(res.data, 'group list length').to.have.lengthOf(10);

            for (const group of res.data) {
              expect(group.key, 'group.key').to.not.be.undefined;
              expect(group.items, `group(${group.key}).items`).to.be.instanceof(
                Array
              );
              expect(
                group.items,
                `group(${group.key}) items list`
              ).to.have.lengthOf(10);
              expect(group.count, `group(${group.key}).count`).to.eql(
                group.items.length
              );

              for (const item of group.items) {
                expect(item.int1, 'item.int1').to.eql(group.key);
              }
            }

            ldone();
          }
        );
      });
    });

    it('list should group with items and select', function(tdone) {
      testQueryValues(tdone, (seneca, ldone) => {
        seneca.act(
          {
            role: 'entitiesQuery',
            domain: 'values',
            cmd: 'list',
            params: {
              group: [
                {
                  selector: 'int1',
                  desc: false,
                  isExpanded: true
                }
              ],
              select: ['int2', 'date1']
            }
          },
          function(err, res) {
            //console.log("Result: ", JSON.stringify(res, null, 2));

            expect(err, 'err').to.be.null;
            expect(res.err$, 'err$').to.be.undefined;

            const x = res.data[0].items[0];

            expect(x).to.have.ownProperty('_id');
            expect(x).to.have.ownProperty('int2');
            expect(x).to.have.ownProperty('date1');

            expect(x).to.not.have.ownProperty('int1');
            expect(x).to.not.have.ownProperty('date2');
            expect(x).to.not.have.ownProperty('string');

            ldone();
          }
        );
      });
    });

    it('list should group with items and secondary sort', function(tdone) {
      testQueryValues(tdone, (seneca, ldone) => {
        seneca.act(
          {
            role: 'entitiesQuery',
            domain: 'values',
            cmd: 'list',
            params: {
              filter: ['int2', '=', 3],
              group: [
                {
                  selector: 'int2',
                  desc: false,
                  isExpanded: true
                }
              ],
              sort: [
                {
                  selector: 'int1',
                  desc: true
                }
              ],
              requireTotalCount: true,
              requireGroupCount: true
            }
          },
          function(err, res) {
            expect(err, 'err').to.be.null;
            expect(res.err$, 'err$').to.be.undefined;

            expect(res.totalCount, 'totalCount').to.eql(20);
            expect(res.groupCount, 'groupCount').to.eql(1);

            expect(res.data, 'res.data').to.be.instanceof(Array);
            expect(res.data, 'group list length').to.have.lengthOf(1);

            for (const group of res.data) {
              //console.log("Checking group", JSON.stringify(group, null, 2));

              expect(group.key, 'group.key').to.not.be.undefined;
              expect(group.items, `group(${group.key}).items`).to.be.instanceof(
                Array
              );
              expect(
                group.items,
                `group(${group.key}) items list`
              ).to.have.lengthOf(20);

              for (let i = 0; i <= 9; i++) {
                expect(group.items[i].int1, `groupitem ${i}`).to.eql(8);
              }
              for (let i = 10; i <= 19; i++) {
                expect(group.items[i].int1, `groupitem ${i}`).to.eql(3);
              }
            }

            ldone();
          }
        );
      });
    });

    it('list should group without items', function(tdone) {
      testQueryValues(tdone, (seneca, ldone) => {
        seneca.act(
          {
            role: 'entitiesQuery',
            domain: 'values',
            cmd: 'list',
            params: {
              group: [
                {
                  selector: 'int1',
                  desc: false
                  // , isExpanded: false
                }
              ],
              requireTotalCount: true,
              requireGroupCount: true
            }
          },
          function(err, res) {
            expect(err, 'err').to.be.null;
            expect(res.err$, 'err$').to.be.undefined;

            expect(res.totalCount, 'totalCount').to.eql(TESTRECORD_COUNT);
            expect(res.groupCount, 'groupCount').to.eql(10);

            expect(res.data, 'res.data').to.be.instanceof(Array);
            expect(res.data, 'group list length').to.have.lengthOf(10);

            for (const group of res.data) {
              expect(group.key, 'group.key').to.not.be.undefined;
              expect(group.items, `group(${group.key}).items`).to.be.null;
              expect(group.count, `group(${group.key}).count`).to.eql(10);
            }

            ldone();
          }
        );
      });
    });

    it('list should group without items, with filter', function(tdone) {
      testQueryValues(tdone, (seneca, ldone) => {
        seneca.act(
          {
            role: 'entitiesQuery',
            domain: 'values',
            cmd: 'list',
            params: {
              filter: ['int1', '=', 3],
              group: [
                {
                  selector: 'int1',
                  desc: false
                  // , isExpanded: false
                }
              ],
              requireTotalCount: true,
              requireGroupCount: true
            }
          },
          function(err, res) {
            expect(err, 'err').to.be.null;
            expect(res.err$, 'err$').to.be.undefined;

            expect(res.totalCount, 'totalCount').to.eql(10);
            expect(res.groupCount, 'groupCount').to.eql(1);

            expect(res.data, 'res.data').to.be.instanceof(Array);
            expect(res.data, 'group list length').to.have.lengthOf(1);

            for (const group of res.data) {
              expect(group.key, 'group.key').to.not.be.undefined;
              expect(group.items, `group(${group.key}).items`).to.be.null;
              expect(group.count, `group(${group.key}).count`).to.eql(10);
            }

            ldone();
          }
        );
      });
    });

    it('list should group without items, with complex filter', function(tdone) {
      testQueryValues(tdone, (seneca, ldone) => {
        seneca.act(
          {
            role: 'entitiesQuery',
            domain: 'values',
            cmd: 'list',
            params: {
              filter: [
                ['int1', '=', 3],
                'or',
                ['int1', '=', 5],
                'or',
                ['int1', '=', 7]
              ],
              group: [
                {
                  selector: 'int1',
                  desc: false
                  // , isExpanded: false
                }
              ],
              requireTotalCount: true,
              requireGroupCount: true
            }
          },
          function(err, res) {
            expect(err, 'err').to.be.null;
            expect(res.err$, 'err$').to.be.undefined;

            expect(res.totalCount, 'totalCount').to.eql(30);
            expect(res.groupCount, 'groupCount').to.eql(3);

            expect(res.data, 'res.data').to.be.instanceof(Array);
            expect(res.data, 'group list length').to.have.lengthOf(3);

            for (const group of res.data) {
              expect(group.key, 'group.key').to.not.be.undefined;
              expect(group.items, `group(${group.key}).items`).to.be.null;
              expect(group.count, `group(${group.key}).count`).to.eql(10);
            }

            ldone();
          }
        );
      });
    });

    it('list should group with items, with complex filter', function(tdone) {
      testQueryValues(tdone, (seneca, ldone) => {
        seneca.act(
          {
            role: 'entitiesQuery',
            domain: 'values',
            cmd: 'list',
            params: {
              filter: [
                ['int1', '=', 3],
                'or',
                ['int1', '=', 5],
                'or',
                ['int1', '=', 7]
              ],
              group: [
                {
                  selector: 'int1',
                  desc: false,
                  isExpanded: true
                }
              ],
              requireTotalCount: true,
              requireGroupCount: true
            }
          },
          function(err, res) {
            expect(err, 'err').to.be.null;
            expect(res.err$, 'err$').to.be.undefined;

            expect(res.totalCount, 'totalCount').to.eql(30);
            expect(res.groupCount, 'groupCount').to.eql(3);

            expect(res.data, 'res.data').to.be.instanceof(Array);
            expect(res.data, 'group list length').to.have.lengthOf(3);

            for (const group of res.data) {
              expect(group.key, 'group.key').to.not.be.undefined;
              expect(group.items, `group(${group.key}).items`).to.be.instanceof(
                Array
              );

              expect(group.items, 'group items list').to.have.lengthOf(10);
              expect(group.count, `group(${group.key}).count`).to.eql(
                group.items.length
              );

              for (const item of group.items) {
                expect(item.int1, 'item.int1').to.eql(group.key);
              }
            }

            ldone();
          }
        );
      });
    });

    it('list should group two levels with bottom-level items', function(tdone) {
      testQueryValues(tdone, (seneca, ldone) => {
        seneca.act(
          {
            role: 'entitiesQuery',
            domain: 'values',
            cmd: 'list',
            params: {
              filter: [
                [['int1', '=', 3], 'or', ['int1', '=', 6]],
                'and',
                [['int2', '=', 3], 'or', ['int2', '=', 1]]
              ],
              group: [
                {
                  selector: 'int1',
                  desc: false,
                  isExpanded: false
                },
                {
                  selector: 'int2',
                  desc: false,
                  isExpanded: true
                }
              ],
              requireTotalCount: true,
              requireGroupCount: true
            }
          },
          function(err, res) {
            //console.log("Result is ", JSON.stringify(res, null, 2));

            expect(err, 'err').to.be.null;
            expect(res.err$, 'err$').to.be.undefined;

            expect(res.totalCount, 'totalCount').to.eql(20);
            expect(res.groupCount, 'groupCount').to.eql(2);

            expect(res.data, 'res.data').to.be.instanceof(Array);
            expect(res.data, 'group list length').to.have.lengthOf(2);

            for (const group1 of res.data) {
              expect(group1.key, 'group1.key').to.not.be.undefined;
              expect(
                group1.items,
                `group1(${group1.key}).items`
              ).to.be.instanceof(Array);

              expect(group1.items, 'group1 items list').to.have.lengthOf(1);
              expect(group1.count, `group(${group1.key}).count`).to.eql(
                group1.items.length
              );

              for (const group2 of group1.items) {
                expect(group2.key, 'group2.key').to.not.be.undefined;
                expect(
                  group2.items,
                  `group2(${group2.key}).items`
                ).to.be.instanceof(Array);

                expect(group2.items, 'group2 items list').to.have.lengthOf(10);
                expect(group2.count, `group(${group2.key}).count`).to.eql(
                  group2.items.length
                );
                for (const item of group2.items) {
                  expect(item.int1, 'item.int1').to.eql(group1.key);
                  expect(item.int2, 'item.int2').to.eql(group2.key);
                }
              }
            }

            ldone();
          }
        );
      });
    });

    it('list should group two levels without bottom-level items', function(
      tdone
    ) {
      testQueryValues(tdone, (seneca, ldone) => {
        seneca.act(
          {
            role: 'entitiesQuery',
            domain: 'values',
            cmd: 'list',
            params: {
              filter: [
                [['int1', '=', 3], 'or', ['int1', '=', 6]],
                'and',
                [['int2', '=', 3], 'or', ['int2', '=', 1]]
              ],
              group: [
                {
                  selector: 'int1',
                  desc: false,
                  isExpanded: false
                },
                {
                  selector: 'int2',
                  desc: false,
                  isExpanded: false
                }
              ],
              requireTotalCount: true,
              requireGroupCount: true
            }
          },
          function(err, res) {
            //console.log("Result is ", JSON.stringify(res, null, 2));

            expect(err, 'err').to.be.null;
            expect(res.err$, 'err$').to.be.undefined;

            expect(res.totalCount, 'totalCount').to.eql(20);
            expect(res.groupCount, 'groupCount').to.eql(2);

            expect(res.data, 'res.data').to.be.instanceof(Array);
            expect(res.data, 'group list length').to.have.lengthOf(2);

            for (const group1 of res.data) {
              expect(group1.key, 'group1.key').to.not.be.undefined;
              expect(
                group1.items,
                `group1(${group1.key}).items`
              ).to.be.instanceof(Array);

              expect(group1.items, 'group1 items list').to.have.lengthOf(1);
              expect(group1.count, `group(${group1.key}).count`).to.eql(
                group1.items.length
              );

              for (const group2 of group1.items) {
                expect(group2.key, 'group2.key').to.not.be.undefined;
                expect(group2.items, 'group2 items list').to.be.null;
                expect(group2.count, `group(${group2.key}).count`).to.eql(10);
              }
            }

            ldone();
          }
        );
      });
    });

    it('list should calculate total summaries group query', function(tdone) {
      testQueryValues(tdone, (seneca, ldone) => {
        seneca.act(
          {
            role: 'entitiesQuery',
            domain: 'values',
            cmd: 'list',
            params: {
              filter: [
                [['int1', '=', 3], 'or', ['int1', '=', 6]],
                'and',
                [['int2', '=', 3], 'or', ['int2', '=', 1]]
              ],
              group: [
                {
                  selector: 'int1',
                  desc: false,
                  isExpanded: false
                },
                {
                  selector: 'int2',
                  desc: false,
                  isExpanded: false
                }
              ],
              totalSummary: [
                {
                  selector: 'int1',
                  summaryType: 'sum'
                },
                {
                  selector: 'int2',
                  summaryType: 'max'
                }
              ],
              requireTotalCount: true,
              requireGroupCount: true
            }
          },
          function(err, res) {
            //console.log("Result is ", JSON.stringify(res, null, 2));

            expect(err, 'err').to.be.null;
            expect(res.err$, 'err$').to.be.undefined;

            expect(res.totalCount, 'totalCount').to.eql(20);
            expect(res.groupCount, 'groupCount').to.eql(2);

            expect(res.summary, 'res.summary').to.be.instanceof(Array);
            expect(res.summary, 'res.summary').to.have.lengthOf(2);
            expect(res.summary[0], 'sum(int1)').to.eql(90);
            expect(res.summary[1], 'max(int2)').to.eql(3);

            ldone();
          }
        );
      });
    });

    it('list should calculate group summaries', function(tdone) {
      testQueryValues(tdone, (seneca, ldone) => {
        seneca.act(
          {
            role: 'entitiesQuery',
            domain: 'values',
            cmd: 'list',
            params: {
              filter: [['int1', '=', 3], 'or', ['int1', '=', 6]],
              group: [
                {
                  selector: 'int1',
                  desc: false,
                  isExpanded: false
                }
              ],
              groupSummary: [
                {
                  selector: 'int1',
                  summaryType: 'sum'
                },
                {
                  selector: 'int2',
                  summaryType: 'max'
                }
              ],
              requireTotalCount: true,
              requireGroupCount: true
            }
          },
          function(err, res) {
            //console.log("Result is ", JSON.stringify(res, null, 2));

            expect(err, 'err').to.be.null;
            expect(res.err$, 'err$').to.be.undefined;

            expect(res.totalCount, 'totalCount').to.eql(20);
            expect(res.groupCount, 'groupCount').to.eql(2);

            expect(res.data, 'res.data').to.be.instanceof(Array);
            expect(res.data, 'group list length').to.have.lengthOf(2);

            expect(res.data[0].summary, 'group1.summary').to.be.instanceof(
              Array
            );
            expect(res.data[0].summary, 'group1.summary').to.have.lengthOf(2);
            expect(res.data[0].summary[0], 'group1.sum(int1)').to.eql(30);
            expect(res.data[0].summary[1], 'group1.max(int2)').to.eql(3);

            expect(res.data[1].summary, 'group2.summary').to.be.instanceof(
              Array
            );
            expect(res.data[1].summary, 'group2.summary').to.have.lengthOf(2);
            expect(res.data[1].summary[0], 'group2.sum(int1)').to.eql(60);
            expect(res.data[1].summary[1], 'group2.max(int2)').to.eql(1);

            ldone();
          }
        );
      });
    });
  });
});
