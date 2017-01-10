module.exports = function(o) {
    this.add({ role: "getvalues", cmd: "all" }, (m, r) => {
	const value = this.make("value");

	value.list$({}, function(err, res) {
	    if (err){
		this.log.error("Can't query values");
		r();
	    }
	    else {
		r(null, res);
	    }
	});
    });
};
