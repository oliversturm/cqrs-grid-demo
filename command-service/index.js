const seneca = require("seneca")();

seneca.
    use("modifyvalues").
    listen({
	type: "tcp",
	pin: "role:modifyvalues"
    });
