module.exports = function(o) {
    this.add("role:entitiesCommand, domain:values, cmd:create", (m, r) => {
//	this.log.info("Creating new object", m);
	this.log.info("Instance: ", m.instance);
	
	const value = this.make("value");
	value.data$(m.instance);
	this.log.info("Persisting value", value);

	const seneca = this;
	
	value.save$(function(err, result) {
	    seneca.log.info("Done saving", result);
	    
	    r(err, { id: result.id });
	});
    });

    this.add("role:entitiesCommand, domain:values, cmd:update", (m, r) => {
	const value = this.make("value");
	value.find$({ id: m.id }, function(err, result) {
	    if (err) return r(err, null);

	    if (res) {
		return res[0].data$(m.instance).save$(r);
	    }
	    else {
		return r(new Error("ID unknown"), null);
	    }

	});
    });
    
};
