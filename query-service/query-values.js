const _ = require("lodash");

module.exports = function(o) {
    this.add("role:entitiesQuery, domain:values, cmd:list", (m, r) => {
	this.log.info("Querying all values");

	this.make("value").list$({},
				 (err, res) => r(err, _.map(res, i => i.data$(false))));
    });

    this.add("role:entitiesQuery, domain:values, cmd:fetch", (m, r) => {
	const value = this.make("value");
	const seneca = this;
	
	value.list$({ id: m.id }, function(err, res) {
	    if (err) return r(err, null);

	    seneca.log.info("Query result", res);
		
	    if (res) {
		return r(null, res[0].data$(false) );
	    }
	    else {
		return r(new Error("ID unknown"), null);
	    }
	});
    });
};
