const seneca = require("seneca")();

seneca.
    use("validator").
    listen({
	type: "tcp",
	port: process.env.QRYSRVC_PORT || 3003,
	pin: "role:validation"
    });
