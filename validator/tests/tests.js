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
		    date1: new Date(),
		    date2: new Date(),
		    int1: 42,
		    int2: 100,
		    string: "something"
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
		    string: "something"
		}
	    }, function(err, res) {
		expect(err, "err").to.be.null;
		expect(res, "res").to.not.be.undefined;
		expect(res.valid, "res.valid").to.be.false;
		
		done();
	    });
	});

	it("should recognize an invalid instance with missing fields", function(done) {
	    var seneca = testValidator(done);

	    seneca.act({
		role: "validation",
		domain: "values",
		cmd: "validateOne",
		instance: {
		    date1: new Date(),
		    int1: 42,
		    int2: 100,
		    string: "something"
		}
	    }, function(err, res) {
		expect(err, "err").to.be.null;
		expect(res, "res").to.not.be.undefined;
		expect(res.valid, "res.valid").to.be.false;
		
		done();
	    });
	});

    	it("should recognize an instance with additional fields by default", function(done) {
	    var seneca = testValidator(done);

	    seneca.act({
		role: "validation",
		domain: "values",
		cmd: "validateOne",
		instance: {
		    date1: new Date(),
		    date2: new Date(),
		    int1: 42,
		    int2: 100,
		    string: "something",
		    additional: 10
		}
	    }, function(err, res) {
		expect(err, "err").to.be.null;
		expect(res, "res").to.not.be.undefined;
		expect(res.valid, "res.valid").to.be.false;
		
		done();
	    });
	});

	it("should accept an instance with additional fields when told", function(done) {
	    var seneca = testValidator(done);

	    seneca.act({
		role: "validation",
		domain: "values",
		cmd: "validateOne",
		allowExtraFields: true,
		instance: {
		    date1: new Date(),
		    date2: new Date(),
		    int1: 42,
		    int2: 100,
		    string: "something",
		    additional: 10
		}
	    }, function(err, res) {
		expect(err, "err").to.be.null;
		expect(res, "res").to.not.be.undefined;
		expect(res.valid, "res.valid").to.be.true;
		
		done();
	    });
	});

	it("should accept an instance with missing fields when told", function(done) {
	    var seneca = testValidator(done);

	    seneca.act({
		role: "validation",
		domain: "values",
		cmd: "validateOne",
		allowIncomplete: true,
		instance: {
		    date1: new Date(),
		    int2: 100,
		    string: "something"
		}
	    }, function(err, res) {
		expect(err, "err").to.be.null;
		expect(res, "res").to.not.be.undefined;
		expect(res.valid, "res.valid").to.be.true;
		
		done();
	    });
	});

	it("should accept an instance with missing fields and extra fields when told", function(done) {
	    var seneca = testValidator(done);

	    seneca.act({
		role: "validation",
		domain: "values",
		cmd: "validateOne",
		allowExtraFields: true,
		allowIncomplete: true,
		instance: {
		    date1: new Date(),
		    int2: 100,
		    string: "something",
		    additional: 10
		}
	    }, function(err, res) {
		expect(err, "err").to.be.null;
		expect(res, "res").to.not.be.undefined;
		expect(res.valid, "res.valid").to.be.true;
		
		done();
	    });
	});

    });
});
