const expect = require("chai").expect;
const Seneca = require("seneca");

function testCommandValues(tdone, test) {
    const db = require("../../db")({
	mongoHost: "localhost",
	mongoDbName: "valuedb_test"
    });

    db(db => {
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
			date1: new Date(),
			date2: new Date(),
			int1: 42,
			int2: 100,
			string: "something"
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
			date1: new Date(),
			date2: new Date(),
			int1: 42,
			int2: 100,
			string: "something"
		    }
		}, function(err, res) {
		    if (err) throw err;

		    seneca.act({
			role: "entitiesCommand",
			domain: "values",
			cmd: "update",
			id: res.id,
			instance: {
			    int1: 55,
			    string: "changed value"
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
			date1: new Date(),
			date2: new Date(),
			int1: 42,
			int2: 100,
			string: "something"
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
			    string: "changed value"
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
