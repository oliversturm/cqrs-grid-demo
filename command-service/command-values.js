module.exports = function(o) {
    this.add("role:entitiesCommand, domain:values, cmd:create", (m, r) => {
//	this.log.info("Creating new object", m);
	this.log.info("Instance: ", m.instance);
	
	const value = this.make("value");
	value.data$(m.instance);
	this.log.info("Persisting value", value);

	const seneca = this;
	
	value.save$(function(err, result){
	    seneca.log.info("Done saving", value);
	    
	    r(err, { id: value.id });
	});
    });
};
