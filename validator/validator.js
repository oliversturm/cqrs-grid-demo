const parambulator = require("parambulator");

const valueSpec = {
    required$: ["test", "val"],
    test: {
	type$: "integer"
    },
    val: {
	type$: "string"
    }
};

function calcOnly(spec) {
    return Object.getOwnPropertyNames(spec).filter(p => !p.endsWith("$"));
}

function includeOnly(spec, only) {
    return Object.assign({ only$: only }, spec);    
}

function createChecker(spec) {
    return parambulator(spec);
}

const valueChecker = createChecker(valueSpec);
const valueCheckerPrecise = createChecker(includeOnly(valueSpec, calcOnly(valueSpec)));

module.exports = function(o) {
    this.add("role:validation, domain: values, cmd:validateOne", (m, r) => {
	const checker = m.preventExtraFields ?
		  valueCheckerPrecise : valueChecker;
	
	checker.validate(m.instance, err => {
	    if (err) {
		r(null, {
		    valid: false,
		    err: err
		});
	    }
	    else {
		r(null, {
		    valid: true
		});
	    }
	});
    });
};
