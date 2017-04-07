var seneca = require("seneca")();
var web = require("seneca-web");
var express = require("express");
var bodyParser = require("body-parser");
var cors = require("cors");

var routes = require("./routes");
var expressApp = express();

var messageUtils = require("../message-utils");
var fixValue = messageUtils.fixValue;
var fixDate = messageUtils.fixDate;

function revive(key, value){
    return fixValue(value, [fixDate]);
}

expressApp.use(bodyParser.json({
    reviver: revive
}));
expressApp.use(cors());

expressApp.use(require("morgan")("dev"));

var config = {
    routes: routes,
    adapter: require("seneca-web-adapter-express"),
    context: expressApp,
    options: {
	parseBody: false
    }
};

seneca.
    use("seneca-amqp-transport").
    use("proxy").
    client({
	type: "amqp",
	hostname: process.env.RABBITMQ_HOST || "rabbitmq",
	port: parseInt(process.env.RABBITMQ_PORT) || 5672,
	pin: [
	    "role:entitiesQuery",
	    "role:entitiesCommand",
	    "role:validation",
	    "role:testing"
	],
	socketOptions: {
	    noDelay: true
	}
    }).
    use(web, config).
    ready(() => {
	var server = seneca.export('web/context')();
	
	var port = process.env.WEBPROXY_PORT || 3000;
	
	server.listen(port, () => {
	    console.log("Web Proxy running on port " + port);
	});
    });
