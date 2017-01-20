const expect = require("chai").expect;
const Seneca = require("seneca");
const MongoClient = require("mongodb").MongoClient;


function testCommandValues(tdone, test) {
    MongoClient.connect("mongodb://localhost:27017/valuedb_test", (err, db) => {
	db.dropDatabase((err, res) => {
	    const seneca = Seneca({
		log: "test"
	    });
	    
	    seneca.test(tdone/* use this for test debugging *//*, "print"*/).
		use(require("../../validator/validator")).
		use(require("../../command-service/command-values"), {
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

describe("command-values", function() {
    describe("#entitiesCommand.values", function() {
	it("should create a new entity and return an id", function(tdone) {
	    testCommandValues(tdone, (seneca, ldone) => {
		seneca.act({
		    role: "entitiesCommand",
		    domain: "values",
		    cmd: "create",
		    instance: {
			test: 42,
			val: "something"
		    }
		}, function(err, res) {
		    expect(err, "err").to.be.null;
		    expect(res, "res").to.not.be.undefined;
		    expect(res.id, "res.id").to.not.be.undefined;
		    ldone();
		});
	    });
	});

	it("should update an existing entity", function(tdone) {
	    testCommandValues(tdone, (seneca, ldone) => {
		seneca.act({
		    role: "entitiesCommand",
		    domain: "values",
		    cmd: "create",
		    instance: {
			test: 42,
			val: "something"
		    }
		}, function(err, res) {
		    if (err) throw err;

		    console.log("res.id " + res.id);
		    

		    seneca.act({
			role: "entitiesCommand",
			domain: "values",
			cmd: "update",
			id: res.id,
			instance: {
			    test: 55,
			    val: "changed value"
			}
		    }, function(err, res) {
			expect(err, "err").to.be.null;
			expect(res, "res").to.be.undefined;
			ldone();
		    });
		});
	    });
	});
	

	it("should update an existing entity partially", function(tdone) {
	    testCommandValues(tdone, (seneca, ldone) => {
		seneca.act({
		    role: "entitiesCommand",
		    domain: "values",
		    cmd: "create",
		    instance: {
			test: 42,
			val: "something"
		    }
		}, function(err, res) {
		    if (err) throw err;

		    console.log("res.id " + res.id);
		    
		    seneca.act({
			role: "entitiesCommand",
			domain: "values",
			cmd: "update",
			id: res.id,
			instance: {
			    val: "changed value"
			}
		    }, function(err, res) {
			expect(err, "err").to.be.null;
			expect(res, "res").to.be.undefined;
			ldone();
		    });
		});
	    });
	    
	});
    });
});
