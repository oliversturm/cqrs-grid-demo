module.exports = function(o) {
    this.add("role:entitiesCommand, domain:values, cmd:create", (m, r) => {
	const seneca = this;
	
	seneca.act({
	    role: "validation",
	    domain: "values",
	    cmd: "validateOne",
	    instance: m.instance
	}, (err, res) => {
	    if (err) return r(err);
	    if (res.valid) {
		const value = this.make("value");
		value.data$(m.instance);

		return value.save$(function(err, result) {
		    if (err) return r(err);
		    return r(null, { id: result.id });
		});
	    }
	    else {
		return r(new Error("Object invalid"));
	    }
	});
    });

    this.add("role:entitiesCommand, domain:values, cmd:update", (m, r) => {
	const seneca = this;
	
	seneca.act({
	    role: "validation",
	    domain: "values",
	    cmd: "validateOne",
	    instance: m.instance,
	    allowIncomplete: true
	}, (err, res) => {
	    if (err) return r(err);
	    if (res.valid) {
		const value = seneca.make("value");
		return value.list$({ id: m.id }, function(err, res) {
		    if (err) return r(err, null);

		    if (res) {
			return res[0].data$(m.instance).save$(r);
		    }
		    else {
			return r(new Error("ID unknown"), null);
		    }
		});
	    }
	    else {
		return r(new Error("Object invalid"));
	    }
	});
    });
};
