const expect = require("chai").expect;
const Seneca = require("seneca");

function testCommandValues(done) {
    return Seneca({
	log: "test"
    }).
	test(done/* use this for test debugging *//*, "print"*/).
	use("basic").
	use("entity").
	use(require("../command-values"));
}

describe("command-values", function() {
    describe("#entitiesCommand.values", function() {
	it("should create a new entity and return an id", function(done) {
	    var seneca = testCommandValues(done);

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
		done();
	    });
	    // this approach results in an overriding error "done called twice"
	    // when errors come up during testing
	    //.
		// ready(function() {
		//     done();
		// });
	});
    });
});
