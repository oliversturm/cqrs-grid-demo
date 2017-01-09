module.exports = [
    {
	pin: "role:getvalues,cmd:*",
	prefix: "/data/v1/values",
	map: {
	    all: {
		GET: true
	    }
	}
    }
];
