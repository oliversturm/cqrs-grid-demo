const parambulator = require("parambulator");
const statusCodes = require("seneca-web-http-status");

module.exports = function(o) {

    this.add("role:web, domain:values, cmd:fetch", function(m, r) {
	this.act("role:entitiesQuery, domain:values, cmd:all", r);
    });

    this.add("role:web, domain:values, cmd:create", function(m, r) {
	const seneca = this;
	const instance = m.args.body.instance;
	seneca.log.info("web.values.create got instance", instance);
	
	const check = parambulator({
	    required$: ["test", "val"],
	    test: {
		type$: "integer"
	    },
	    val: {
		type$: "string"
	    }
	});
	
	check.validate(instance, function(err) {
	    if (err) return r(null, statusCodes.custom(400, err));
	    
	    return seneca.act({
		role: "entitiesCommand",
		domain: "values",
		cmd: "create",
		instance: instance
	    }, function(err, id) {
		if (err) return r(null, statusCodes.custom(400, err));
		const res = statusCodes[201];
		res.http$.headers = {
		    "Location": "/data/v1/values/" + id
		};
		
		return r(err, res);
	    });
	});
    });
};
