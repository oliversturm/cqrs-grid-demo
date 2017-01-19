
module.exports = function(o) {
    this.add("role:testing, domain:values, cmd:createTestData", function(m, r) {
	const seneca = this;
	
	for (var i = 1; i <= m.count; i++) {
	    seneca.act({
		role: "entitiesCommand",
		domain: "values",
		cmd: "create",
		instance: {
		    test: Math.floor((Math.random() * 100) + 1),
		    val: "Item " + i
		}
	    }, err => {
		if (err) r(err);
	    });
	}
	
	return r();
    });
};
