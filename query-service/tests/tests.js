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
		    expect(res.totalCount).to.eql(TESTRECORD_COUNT);
		    
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
		    expect(res.totalCount).to.eql(TESTRECORD_COUNT);
		    
		    expect(res.data, "res.data").to.be.instanceof(Array);
		    expect(res.data, "result").to.have.lengthOf(5);
		    ldone();
		});
	    });
	});
    });
});
