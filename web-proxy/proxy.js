function sendErrorStatus(m, status, msg="") {
    m.response$.status(status).send({
	message: msg
    });
}

const errors = {
    invalid: {
	status: 400,
	message: "Invalid data"
    },
    unknownid: {
	status: 404,
	message: "Invalid ID"
    }
};


function checkError(m, res) {
    if (res && res.err) {
	const details = errors[res.err];
	if (details) sendErrorStatus(m, details.status, details.message);
	else sendError(m, 500);
	return true;
    }
    return false;
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
		sendErrorStatus(m, 400, res.err);
		return r();
	    }
	    
	    return seneca.act({
		role: "entitiesCommand",
		domain: "values",
		cmd: "create",
		instance: instance
	    }, function(err, res) {
		if (err) return r(err);
		if (checkError(m, res)) return r();
		
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
	    sendErrorStatus(m, 404, "The given ID is invalid");
	    return r();
	}

	return seneca.act({
	    role: "entitiesQuery",
	    domain: "values",
	    cmd: "fetch",
	    id: id
	}, function(err, res) {
	    if (err) return r(err);
	    if (checkError(m, res)) return r();
	    
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
	    if (checkError(m, res)) return r();

	    m.response$.sendStatus(204);
	    return r();
	    
	});
    });
};
