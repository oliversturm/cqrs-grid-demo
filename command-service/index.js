const seneca = require("seneca")();

seneca.
    use("basic").
    use("entity").
    use("modifyvalues").
    listen({
	type: "tcp",
	port: process.env.QRYSRVC_PORT || 3002,
	pin: "role:modifyvalues"
    });
