module.exports = [
    {
	pin: "role:web,domain:values,cmd:fetch",
	prefix: "/data/v1/values",
	map: {
	    all: {
		GET: true
	    }
	}
    },
    {
	pin: "role:web,domain:values,cmd:create",
	prefix: "/data/v1/values",
	map: {
	    create: {
		POST: true
	    }
	}
    }
];
