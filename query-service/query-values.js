module.exports = function(o) {
    this.add("role:entitiesQuery, domain:values, cmd:all", (m, r) => {
	this.log.info("Querying all values");

	this.make("value").list$({}, (err, res) => r(err, { result: res }));
    });
};
