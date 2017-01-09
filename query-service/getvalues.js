module.exports = function(o) {
    this.add({ role: "getvalues", cmd: "all" }, (m, r) => {
	r(null, {
	    values: [
		{
		    value: 1,
		    timestamp: new Date()
		},
		{
		    value: 2,
		    timestamp: new Date()
		},
		{
		    value: 3,
		    timestamp: new Date()
		}
	    ]
	});
    });
};
