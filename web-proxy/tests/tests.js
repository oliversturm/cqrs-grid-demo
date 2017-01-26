const chai = require("chai");
const chaiHttp = require("chai-http");
chai.use(chaiHttp);


const expect = chai.expect;
const Seneca = require("seneca");

const web = require("seneca-web");
const express = require("express");
const bodyParser = require("body-parser");

const routes = require("../routes");
const proxy = require("../proxy");
const queryService = require("../../query-service/query-values");
const commandService = require("../../command-service/command-values");
const validator = require("../../validator/validator");

const BASE = "/data/v1/values";

const val1 = {
    date1: new Date(),
    date2: new Date(),
    int1: 52,
    int2: 100,
    string: "something"
};
const val2 = {
    date1: new Date(),
    date2: new Date(),
    int1: 62,
    int2: 100,
    string: "something else"
};

function create(server, val, cont) {
    chai.request(server).
	post(BASE).
	send(val).
	then(cont).
	catch(err => { throw err; });
}



describe("REST tests", () => {

    function testServer(tdone, test) {
	const db = require("../../db")({
	    mongoHost: "localhost",
	    mongoDbName: "valuedb_test"
	});

	db(db => {
	    db.dropDatabase((err, res) => {
		const expressApp = express();

		// date reviving copied from https://github.com/expressjs/body-parser/issues/17
		var regexIso8601 = /^(\d{4}|\+\d{6})(?:-(\d{2})(?:-(\d{2})(?:T(\d{2}):(\d{2}):(\d{2})\.(\d{1,})(Z|([\-+])(\d{2}):(\d{2}))?)?)?)?$/;

		function reviveDates(key, value){
		    var match;
		    if (typeof value === "string" && (match = value.match(regexIso8601))) {
			var milliseconds = Date.parse(match[0]);
			if (!isNaN(milliseconds)) {
			    return new Date(milliseconds);
			}
		    }
		    return value;
		}

		expressApp.use(bodyParser.json({
		    reviver: reviveDates
		}));
		//expressApp.use(require("morgan")("dev"));

		var config = {
		    routes: routes,
		    adapter: require("seneca-web-adapter-express"),
		    context: expressApp,
		    options: {
			parseBody: false
		    }
		};

		const seneca = Seneca({
		    log: "test"
		});

		seneca.test(tdone/* use this for test debugging *//*, "print"*/).
		    use(proxy).
		    use(queryService, { connectedDb: db }).
		    use(commandService, { connectedDb: db }).
		    use(validator).
		    use(web, config).
		    ready(() => {
			const server = seneca.export('web/context')();
			test(server, () => {
			    seneca.close();
			    tdone();
			});
		    });
	    });
	});
    }

    describe("POST value", () => {
	it("should POST new value", tdone => {
	    testServer(tdone, (server, ldone) => {
		chai.request(server).
		    post(BASE).
		    send(val1).
		    end((err, res) => {
			expect(err).to.be.null;
			expect(res).to.have.status(201);
			expect(res).to.have.header("Location");
			ldone();
		    });
	    });
	});

    	it("POST should fail on invalid value", tdone => {
	    testServer(tdone, (server, ldone) => {
		const newVal = {
		    date1: new Date(),
		    date2: new Date(),
		    int1: 42,
		    int2: 100,
		    barg: "something"
		};

		chai.request(server).
		    post(BASE).
		    send(newVal).
		    end((err, res) => {
			expect(err).to.not.be.null;
			expect(res).to.have.status(400);
			ldone();
		    });
	    });
	});

	it("POST should fail on invalid json", tdone => {
	    testServer(tdone, (server, ldone) => {
		chai.request(server).
		    post(BASE).
		    send("test: 42, barg: something }").
		    end((err, res) => {
			expect(err).to.not.be.null;
			expect(res).to.have.status(400);
			ldone();
		    });
	    });
	});

        it("POST should fail on additional fields", tdone => {
	    testServer(tdone, (server, ldone) => {
		const newVal = {
		    date1: new Date(),
		    date2: new Date(),
		    int1: 42,
		    int2: 100,
		    string: "something",
		    barg: "something else"
		};

		chai.request(server).
		    post(BASE).
		    send(newVal).
		    end((err, res) => {
			expect(err).to.not.be.null;
			expect(res).to.have.status(400);
			ldone();
		    });
	    });
	});
    });

    describe("PUT value", () => {
	it ("changes a value", tdone => {
	    testServer(tdone, (server, ldone) => {
		create(server, val1, res => {
		    const newVal = {
			int1: 52
		    };

		    const location = res.header.location;
		    
		    chai.request(server).
			put(location).
			send(newVal).
			then(res => {
			    expect(res).to.have.status(204);
			    ldone();
			}).
			catch(err =>  {
			    throw err;
			});
		});
		
	    });
	});

    	it ("should fail on additional fields", tdone => {
	    testServer(tdone, (server, ldone) => {
		create(server, val1, res => {
		    const newVal = {
			int1: 52,
			unknown: 10
		    };

		    const location = res.header.location;
		    
		    chai.request(server).
			put(location).
			send(newVal).
			end((err, res) => {
			    expect(res).to.have.status(400);
			    ldone();
			});
		});
		
	    });
	});

        it ("should fail on invalid id", tdone => {
	    testServer(tdone, (server, ldone) => {
		create(server, val1, res => {
		    const newVal = {
			int1: 52
		    };

		    const location = BASE + "/12345";
		    
		    
		    chai.request(server).
			put(location).
			send(newVal).
			end((err, res) => {
			    expect(res).to.have.status(404);
			    ldone();
			});
		});
		
	    });
	});
});
    

    describe("GET value(s)", () => {
	it("retrieves all values", tdone => {
	    testServer(tdone, (server, ldone) => {
		create(server, val1, () => {
		    create(server, val2, () => {
			chai.request(server).
			    get(BASE).
			    then(res => {
				expect(res).to.have.status(200);
				expect(res.body.data).to.be.a("array");
				expect(res.body.data).to.have.lengthOf(2);
				ldone();
			    }).
			    catch(err =>  {
				throw err;
			    });
		    });
		});
		
	    });
	});
	it("retrieves one value", tdone => {
	    testServer(tdone, (server, ldone) => {
		create(server, val1, () => {
		    create(server, val2, res => {
			const location = res.header.location;
			
			chai.request(server).
			    get(location).
			    then(res => {
				expect(res).to.have.status(200);
				const o = res.body;
				const id = location.substr(location.lastIndexOf("/") + 1);
				
				expect(o).to.be.a("object");
				expect(o).to.have.property("date1");
				expect(o).to.have.property("date2");
				expect(o).to.have.property("int1");
				expect(o).to.have.property("int2");
				expect(o).to.have.property("string");
				expect(o).to.have.property("_id");
				expect(o._id).to.eql(id);
				
				ldone();
			    }).
			    catch(err =>  {
				throw err;
			    });
		    });
		});
		
	    });
	});
	it("GET should fail on invalid id", tdone => {
	    testServer(tdone, (server, ldone) => {
		chai.request(server).
		    get(BASE + "/12345").
		    end((err, res) => {
			expect(res).to.have.status(404);
			ldone();
		    });
		
	    });
	});
    });
    
});

