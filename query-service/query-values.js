module.exports = function(o) {
    this.add("role:entitiesQuery, domain:values, cmd:all", (m, r) => {
	this.log.info("Querying all values");
	
	return this.make("value").list$({}, r);
    });
};
