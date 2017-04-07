const seneca = require("seneca")();

seneca.
    use("seneca-amqp-transport").
    use("query-values").
    listen({
	type: "amqp",
	hostname: process.env.RABBITMQ_HOST || "rabbitmq",
	port: parseInt(process.env.RABBITMQ_PORT) || 5672,
	pin: "role:entitiesQuery"
    });
