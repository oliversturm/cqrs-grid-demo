const expect = require("chai").expect;
const Seneca = require("seneca");

function testQueryValues(done) {
    return Seneca({
	log: "test"
    }).
	test(done/* use this for test debugging *//*, "print"*/).
	use("basic").
	use("entity").
	use(require("../query-values"));
}

describe("query-values", function() {
    describe("#entitiesQuery.values", function() {
	it("list should retrieve all entities", function(done) {
	    var seneca = testQueryValues(done);

	    const value = seneca.make("value");
	    value.test = 42;
	    value.save$(function(err, result) {
		expect(err, "saveerr").to.be.null;

		seneca.act({
		    role: "entitiesQuery",
		    domain: "values",
		    cmd: "list"
		}, function(err, res) {
		    expect(err, "err").to.be.null;
		    expect(res.totalCount).to.eql(1);
		    
		    expect(res.data, "res.data").to.be.instanceof(Array);
		    expect(res.data, "result").to.have.lengthOf(1);
		    expect(res.data[0], "result item").to.eql({
			id: result.id,
			test: 42
		    });
		    
		    done();
		});

	    });
	    
	});

    	it("fetch should retrieve one entity by id", function(done) {
	    var seneca = testQueryValues(done);

	    const value = seneca.make("value");
	    value.test = 42;
	    value.save$(function(err, result) {
		expect(err, "saveerr").to.be.null;

		seneca.act({
		    role: "entitiesQuery",
		    domain: "values",
		    cmd: "fetch",
		    id: result.id
		}, function(err, res) {
		    expect(err, "err").to.be.null;
		    expect(res, "result").to.eql({
			id: result.id,
			test: 42
		    });
		    
		    done();
		});

	    });
	    
	});
    });
});
