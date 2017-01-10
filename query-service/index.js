const seneca = require("seneca")();

seneca.
    use("basic").
    use("entity").
    use("getvalues").
    listen({
	type: "tcp",
	port: process.env.QRYSRVC_PORT || 3001,
	pin: "role:getvalues"
    });
