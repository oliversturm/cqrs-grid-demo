var seneca = require("seneca")();
var web = require("seneca-web");
var express = require("express");

var routes = require("./routes");

var config = {
  routes: routes,
  adapter: require("seneca-web-adapter-express"),
  context: express()
};

seneca.
    client({
	type: "tcp",
	// expecting "query-service" to be available
	// as a docker link
	host: process.env.GETVALUES_HOST || "query-service",
	port: process.env.GETVALUES_PORT || 3001,
	pin: "role:getvalues"
    }).
    use(web, config).
    ready(() => {
	var server = seneca.export('web/context')();
	
	var port = process.env.PROXY_PORT || 3000;
	
	server.listen(port, () => {
	    console.log("Web Proxy running on port " + port);
	});
    });
