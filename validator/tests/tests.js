const expect = require("chai").expect;
const Seneca = require("seneca");

function testValidator(done) {
    return Seneca({
	log: "test"
    }).
	test(done/* use this for test debugging *//*, "print"*/).
	use(require("../validator"));
}

describe("validator", function() {
    describe("#validation.values", function() {
	it("should recognize a valid instance", function(done) {
	    var seneca = testValidator(done);

	    seneca.act({
		role: "validation",
		domain: "values",
		cmd: "validateOne",
		instance: {
		    test: 42,
		    val: "something"
		}
	    }, function(err, res) {
		expect(err, "err").to.be.null;
		expect(res, "res").to.not.be.undefined;
		expect(res.valid, "res.valid").to.be.true;
		
		done();
	    });
	});

    	it("should recognize an invalid instance", function(done) {
	    var seneca = testValidator(done);

	    seneca.act({
		role: "validation",
		domain: "values",
		cmd: "validateOne",
		instance: {
		    argh: 42,
		    val: "something"
		}
	    }, function(err, res) {
		expect(err, "err").to.be.null;
		expect(res, "res").to.not.be.undefined;
		expect(res.valid, "res.valid").to.be.false;
		
		done();
	    });
	});

	it("should accept an instance with additional fields by default", function(done) {
	    var seneca = testValidator(done);

	    seneca.act({
		role: "validation",
		domain: "values",
		cmd: "validateOne",
		instance: {
		    test: 42,
		    val: "something",
		    additional: "something else"
		}
	    }, function(err, res) {
		expect(err, "err").to.be.null;
		expect(res, "res").to.not.be.undefined;
		expect(res.valid, "res.valid").to.be.true;
		
		done();
	    });
	});

    	it("should recognize an instance with additional fields when told", function(done) {
	    var seneca = testValidator(done);

	    seneca.act({
		role: "validation",
		domain: "values",
		cmd: "validateOne",
		preventExtraFields: true,
		instance: {
		    test: 42,
		    val: "something",
		    additional: "something else"
		}
	    }, function(err, res) {
		expect(err, "err").to.be.null;
		expect(res, "res").to.not.be.undefined;
		expect(res.valid, "res.valid").to.be.false;
		
		done();
	    });
	});
    });
});
