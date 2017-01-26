const expect = require("chai").expect;
const Seneca = require("seneca");

const TESTRECORD_COUNT = 100;

function testQueryValues(tdone, test) {
    const db = require("../../db")({
	mongoHost: "localhost",
	mongoDbName: "valuedb_test"
    });

    
    db(db => {
	db.dropDatabase((err, res) => {

	    const values = db.collection("values");
	    Promise.all(
		Array.from(new Array(TESTRECORD_COUNT), (v, i) => i + 1).map(
		    n => values.insertOne({
			test: n % 10,
			val: "Item " + n
		    })
		)
	    ).then(() => {
		const seneca = Seneca({
		    log: "test"
		});
		
		seneca.test(tdone/* use this for test debugging *//*, "print"*/).
		    use(require("../query-values"), {
			connectedDb: db
		    }).ready(() => {
			test(seneca, () => {
			    seneca.close();
			    db.close();
			    tdone();
			});
		    });	
	    });
	});	
    });
}

describe("query-values", function() {
    describe("#entitiesQuery.values", function() {
	it("list should retrieve all entities", function(tdone) {
	    testQueryValues(tdone, (seneca, ldone) => {
		seneca.act({
		    role: "entitiesQuery",
		    domain: "values",
		    cmd: "list"
		}, function(err, res) {
		    expect(err, "err").to.be.null;
		    expect(res.err$, "err$").to.be.undefined;
		    expect(res.totalCount, "totalCount").to.eql(TESTRECORD_COUNT);
		    
		    expect(res.data, "res.data").to.be.instanceof(Array);
		    expect(res.data, "result").to.have.lengthOf(TESTRECORD_COUNT);
		    ldone();
		});
	    });
	});

    	it("fetch should retrieve one entity by id", function(tdone) {
	    testQueryValues(tdone, (seneca, ldone) => {
		seneca.act({
		    role: "entitiesQuery",
		    domain: "values",
		    cmd: "list"
		}, function(err, res) {
		    expect(err, "listerr").to.be.null;
		    const testObject = res.data[0];
		    console.log("test object", testObject);
		    
		    seneca.act({
			role: "entitiesQuery",
			domain: "values",
			cmd: "fetch",
			id: testObject._id
		    }, function(err, res) {
			expect(err, "err").to.be.null;
			expect(res.err$, "err$").to.be.undefined;
			expect(res, "result").to.eql(testObject);
			
			ldone();
		    });

		});
		
	    });
	});

	it("list should accept skip", function(tdone) {
	    testQueryValues(tdone, (seneca, ldone) => {
		seneca.act({
		    role: "entitiesQuery",
		    domain: "values",
		    cmd: "list",
		    params: {
			skip: 5
		    }
		}, function(err, res) {
		    expect(err, "err").to.be.null;
		    expect(res.err$, "err$").to.be.undefined;
		    expect(res.totalCount).to.eql(TESTRECORD_COUNT);
		    
		    expect(res.data, "res.data").to.be.instanceof(Array);
		    expect(res.data, "result").to.have.lengthOf(TESTRECORD_COUNT - 5);
		    ldone();
		});
	    });
	});

	it("list should accept take", function(tdone) {
	    testQueryValues(tdone, (seneca, ldone) => {
		seneca.act({
		    role: "entitiesQuery",
		    domain: "values",
		    cmd: "list",
		    params: {
			take: 5
		    }
		}, function(err, res) {
		    expect(err, "err").to.be.null;
		    expect(res.err$, "err$").to.be.undefined;
		    expect(res.totalCount).to.eql(TESTRECORD_COUNT);
		    
		    expect(res.data, "res.data").to.be.instanceof(Array);
		    expect(res.data, "result").to.have.lengthOf(5);
		    ldone();
		});
	    });
	});

    	it("list should sort ascending", function(tdone) {
	    testQueryValues(tdone, (seneca, ldone) => {
		seneca.act({
		    role: "entitiesQuery",
		    domain: "values",
		    cmd: "list",
		    params: {
			take: 5,
			sort: [
			    {
				selector: "test",
				desc: false
			    }
			]
		    }
		}, function(err, res) {
		    expect(err, "err").to.be.null;
		    expect(res.err$, "err$").to.be.undefined;

		    expect(res.data, "res.data").to.be.instanceof(Array);
		    expect(res.data, "result").to.have.lengthOf(5);
		    expect(res.data[0].test).to.eql(0);
		    expect(res.data[1].test).to.eql(0);
		    expect(res.data[2].test).to.eql(0);
		    expect(res.data[3].test).to.eql(0);
		    expect(res.data[4].test).to.eql(0);
		    
		    ldone();
		});
	    });
	});

    	it("list should sort descending", function(tdone) {
	    testQueryValues(tdone, (seneca, ldone) => {
		seneca.act({
		    role: "entitiesQuery",
		    domain: "values",
		    cmd: "list",
		    params: {
			take: 5,
			sort: [
			    {
				selector: "test",
				desc: true
			    }
			]
		    }
		}, function(err, res) {
		    expect(err, "err").to.be.null;
		    expect(res.err$, "err$").to.be.undefined;
		    
		    expect(res.data, "res.data").to.be.instanceof(Array);
		    expect(res.data, "result").to.have.lengthOf(5);
		    expect(res.data[0].test).to.eql(9);
		    expect(res.data[1].test).to.eql(9);
		    expect(res.data[2].test).to.eql(9);
		    expect(res.data[3].test).to.eql(9);
		    expect(res.data[4].test).to.eql(9);
		    
		    ldone();
		});
	    });
	});

	it("list should group", function(tdone) {
	    testQueryValues(tdone, (seneca, ldone) => {
		seneca.act({
		    role: "entitiesQuery",
		    domain: "values",
		    cmd: "list",
		    params: {
			group: [
			    {
				selector: "test",
				desc: false
			    }
			]
		    }
		}, function(err, res) {
		    console.log("Result is", res);
		    
		    expect(err, "err").to.be.null;
		    expect(res.err$, "err$").to.be.undefined;

		    expect(res.totalCount).to.eql(TESTRECORD_COUNT);
		    expect(res.groupCount).to.eql(10);
		    
		    expect(res.data, "res.data").to.be.instanceof(Array);
		    expect(res.data, "group list length").to.have.lengthOf(10);
		    ldone();
		});
	    });
	});
	
	it("list should filter with =", function(tdone) {
	    testQueryValues(tdone, (seneca, ldone) => {
		seneca.act({
		    role: "entitiesQuery",
		    domain: "values",
		    cmd: "list",
		    params: {
			filter: [
			    "test", "=", 3
			]
		    }
		}, function(err, res) {
		    expect(err, "err").to.be.null;
		    expect(res.err$, "err$").to.be.undefined;
		    expect(res.totalCount).to.eql(TESTRECORD_COUNT);
		    
		    expect(res.data, "res.data").to.be.instanceof(Array);
		    expect(res.data, "list length").to.have.lengthOf(10);
		    ldone();
		});
	    });
	});

	it("list should filter with =", function(tdone) {
	    testQueryValues(tdone, (seneca, ldone) => {
		seneca.act({
		    role: "entitiesQuery",
		    domain: "values",
		    cmd: "list",
		    params: {
			filter: [
			    "test", "<", 5
			]
		    }
		}, function(err, res) {
		    expect(err, "err").to.be.null;
		    expect(res.err$, "err$").to.be.undefined;
		    expect(res.totalCount).to.eql(TESTRECORD_COUNT);
		    
		    expect(res.data, "res.data").to.be.instanceof(Array);
		    expect(res.data, "list length").to.have.lengthOf(50);
		    ldone();
		});
	    });
	});

	it("list should filter with endswith", function(tdone) {
	    testQueryValues(tdone, (seneca, ldone) => {
		seneca.act({
		    role: "entitiesQuery",
		    domain: "values",
		    cmd: "list",
		    params: {
			filter: [
			    "val", "endswith", "23"
			]
		    }
		}, function(err, res) {
		    expect(err, "err").to.be.null;
		    expect(res.err$, "err$").to.be.undefined;
		    expect(res.totalCount).to.eql(TESTRECORD_COUNT);
		    
		    expect(res.data, "res.data").to.be.instanceof(Array);
		    expect(res.data, "list length").to.have.lengthOf(1);
		    ldone();
		});
	    });
	});

    });
});
