const expect = require("chai").expect;
const Seneca = require("seneca");
const MongoClient = require("mongodb").MongoClient;

function testQueryValues(tdone, test) {
    MongoClient.connect("mongodb://localhost:27017/valuedb_test", (err, db) => {
	db.dropDatabase((err, res) => {
	    const seneca = Seneca({
		log: "test"
	    });
	    
	    seneca.test(tdone/* use this for test debugging *//*, "print"*/).
		use(require("../../validator/validator")).
		use(require("../../command-service/command-values"), {
		    connectedDb: db
		}).
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
}

describe("query-values", function() {
    describe("#entitiesQuery.values", function() {
	it("list should retrieve all entities", function(tdone) {
	    testQueryValues(tdone, (seneca, ldone) => {
		seneca.act({
		    role: "entitiesCommand",
		    domain: "values",
		    cmd: "create",
		    instance: {
			test: 42,
			val: "something"
		    }
		}, function(err, res) {
		    expect(err, "saveerr").to.be.null;
		    const newObjectId = res.id;
		    
		    seneca.act({
			role: "entitiesQuery",
			domain: "values",
			cmd: "list"
		    }, function(err, res) {
			console.log("Query result: ", res);
			
			expect(err, "err").to.be.null;
			expect(res.totalCount).to.eql(1);
			
			expect(res.data, "res.data").to.be.instanceof(Array);
			expect(res.data, "result").to.have.lengthOf(1);
			expect(res.data[0], "result item").to.eql({
			    _id: newObjectId,
			    test: 42,
			    val: "something"
			});
			
			ldone();
		    });
		});
	    });
	});

    	it("fetch should retrieve one entity by id", function(tdone) {
	    testQueryValues(tdone, (seneca, ldone) => {
		seneca.act({
		    role: "entitiesCommand",
		    domain: "values",
		    cmd: "create",
		    instance: {
			test: 42,
			val: "something"
		    }
		}, function(err, res) {
		    expect(err, "saveerr").to.be.null;
		    const newObjectId = res.id;
		    
		    seneca.act({
			role: "entitiesQuery",
			domain: "values",
			cmd: "fetch",
			id: newObjectId
		    }, function(err, res) {
			expect(err, "err").to.be.null;
			expect(res, "result").to.eql({
			    _id: newObjectId,
			    test: 42,
			    val: "something"
			});
			
			ldone();
		    });

		});
		
	    });
	});
    });
});
