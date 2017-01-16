function sendError(m, status, msg="") {
    m.response$.status(status).send({
	message: msg
    });
}

module.exports = function(o) {

    this.add("role:web, domain:values, cmd:list", function(m, r) {
	this.act("role:entitiesQuery, domain:values, cmd:list", r);
    });

    this.add("role:web, domain:values, cmd:create", function(m, r) {
	const seneca = this;
	const instance = m.args.body;

	seneca.act({
	    role: "validation",
	    domain: "values",
	    cmd: "validateOne",
	    instance: instance
	}, (err, res) => {
	    if (err) r(err);
	    
	    if (!res.valid) {
		sendError(m, 400, res.err);
		return r();
	    }
	    
	    return seneca.act({
		role: "entitiesCommand",
		domain: "values",
		cmd: "create",
		instance: instance
	    }, function(err, res) {
		if (err) return r(err);
		
		if (res && res.err) {
		    if (res.err === "invalid") {
			sendError(m, 400, "The creation data is invalid");
		    }
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
	    sendError(m, 404, "The given ID is invalid");
	    return r();
	}

	return seneca.act({
	    role: "entitiesQuery",
	    domain: "values",
	    cmd: "fetch",
	    id: id
	}, function(err, res) {
	    if (err) return r(err);

	    if (res && res.err) {
		if (res.err === "unknownid") {
		    sendError(m, 404, "The given ID is invalid");
		}
		return r();
	    }
	    
	    m.response$.status(200).send(res);
	    return r();
	});
    });

    this.add("role:web, domain:values, cmd:update", function(m, r) {
	const seneca = this;
	const id = m.args.params.id;

	if (!(/^[\dA-Za-z]+$/.test(id))) {
	    sendError(m, 404);
	    return r();
	}

	const instance = m.args.body;

	return seneca.act({
	    role: "entitiesCommand",
	    domain: "values",
	    cmd: "update",
	    id: id,
	    instance: instance
	}, function(err, res) {
	    if (err) return r(err);
	    
	    if (res && res.err) {
		console.log("have error " + res.err);
		
		if (res.err === "unknownid") {
		    sendError(m, 404, "The given ID is invalid");
		} 
		else if (res.err === "invalid") {
		    sendError(m, 400, "The update data is invalid");
		}
		return r();
	    }	    
	    m.response$.sendStatus(204);
	    return r();
	    
	});
    });
};
