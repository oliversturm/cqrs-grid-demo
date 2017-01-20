const seneca = require("seneca")();

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
	port: process.env.QRYSRVC_PORT || 3002,
	pin: "role:entitiesCommand"
    });
