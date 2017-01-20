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
    test: 52,
    val: "something"
};
const val2 = {
    test: 62,
    val: "something else"
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

		expressApp.use(bodyParser.json());
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

		seneca.
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
		const newVal = {
		    test: 52,
		    val: "something"
		};

		chai.request(server).
		    post(BASE).
		    send(newVal).
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
		    test: 52,
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
		    test: 52,
		    val: "something",
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
			test: 52
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
			test: 52,
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
			test: 52
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
				expect(o).to.have.property("test");
				expect(o).to.have.property("val");
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

