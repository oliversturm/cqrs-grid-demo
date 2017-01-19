const seneca = require("seneca")();

seneca.
    client({
	type: "tcp",
	// expecting "command-service" to be available
	// as a docker link
	host: process.env.CMDSRVC_HOST || "command-service",
	port: process.env.CMDSRVC_PORT || 3002,
	pin: "role:entitiesCommand"
    }).
    use("testing").
    listen({
	type: "tcp",
	port: process.env.TESTINGSRVC_PORT || 3005,
	pin: "role:testing"
    });
