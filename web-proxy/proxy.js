const parambulator = require("parambulator");
const statusCodes = require("seneca-web-http-status");

const valueSpec = parambulator({
    required$: ["test", "val"],
    test: {
	type$: "integer"
    },
    val: {
	type$: "string"
    }
});


module.exports = function(o) {

    this.add("role:web, domain:values, cmd:list", function(m, r) {
	this.act("role:entitiesQuery, domain:values, cmd:list", r);
    });

    this.add("role:web, domain:values, cmd:create", function(m, r) {
	const seneca = this;
	const instance = m.args.body.instance;
	seneca.log.info("web.values.create got instance", instance);
	
	valueSpec.validate(instance, function(err) {
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

    this.add("role:web, domain:values, cmd:fetch", function(m, r) {
	const seneca = this;
	const id = m.args.params.id;

	if (!(/^[\dA-Za-z]+$/.test(id))) {
	    m.response$.sendStatus(404);
	    return r();
	}

	return seneca.act({
	    role: "entitiesQuery",
	    domain: "values",
	    cmd: "fetch",
	    id: id
	}, function(err, res) {
	    if (err) {
		m.response$.status(404).send({
		    message: err
		});
		return r();
	    }
	    
	    m.response$.status(200).send(res);
	    return r();
	});
    });
};
