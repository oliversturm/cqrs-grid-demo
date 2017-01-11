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
	    if (err) {
		m.response$.status(400).send({
		    message: err
		});
		return r();
	    }
	    
	    return seneca.act({
		role: "entitiesCommand",
		domain: "values",
		cmd: "create",
		instance: instance
	    }, function(err, res) {
		if (err) {
		    m.response$.status(400).send({
			message: err
		    });
		    return r();
		}

		m.response$.location("/data/v1/values/" + res.id);
		m.response$.sendStatus(201);
		
		return r();
	    });
	});
    });
};
