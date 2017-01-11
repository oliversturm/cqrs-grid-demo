const seneca = require("seneca")();

seneca.
    use("entity").
    use("mongo-store", {
	name: process.env.MONGO_DBNAME || "valuedb",
	host: process.env.MONGO_HOST || "mongo",
	port: process.env.MONGO_PORT || 27017
    }).
    use("command-values").
    listen({
	type: "tcp",
	port: process.env.QRYSRVC_PORT || 3002,
	pin: "role:entitiesCommand"
    });
