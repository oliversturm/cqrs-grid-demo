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
	it("should retrieve all entities", function(done) {
	    var seneca = testQueryValues(done);

	    const value = seneca.make("value");
	    value.test = 42;
	    value.save$(function(err, result) {
		expect(err, "saveerr").to.be.null;

		seneca.act({
		    role: "entitiesQuery",
		    domain: "values",
		    cmd: "all"
		}, function(err, res) {
		    expect(err, "err").to.be.null;
		    expect(res.result, "res.result").to.be.instanceof(Array);
		    expect(res.result, "result").to.have.lengthOf(1);
		    expect(res.result[0].id, "result.id").to.equal(result.id);
		    expect(res.result[0].test, "result.test").to.equal(42);
		    
		    done();
		});

	    });
	    
	});
    });
});
