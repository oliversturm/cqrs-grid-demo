const seneca = require("seneca")({
    //log: "all"
});

seneca.
    client({
	type: "tcp",
	host: process.env.VALSRVC_HOST || "validator",
	port: process.env.VALSRVC_PORT || 3003,
	pin: "role:validation"
    }).
    use("command-values").
    listen({
	type: "tcp",
	port: process.env.CMDSRVC_PORT || 3002,
	pin: "role:entitiesCommand"
    });
