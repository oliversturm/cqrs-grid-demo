const seneca = require("seneca")();

seneca.
    use("getvalues").
    listen({
	type: "tcp",
	port: 3001,
	pin: "role:getvalues"
    });
