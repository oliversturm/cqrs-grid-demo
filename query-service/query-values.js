const _ = require("lodash");
const mongodb = require("mongodb");
const MongoClient = mongodb.MongoClient;
const Server = mongodb.Server;

function skip(a, n) {
    return n ? a.slice(n) : a;
}

function connect(f) {
    MongoClient.connect(`mongodb://${process.env.MONGO_HOST || "mongo"}:${process.env.MONGO_PORT || 27017}/${process.env.MONGO_DBNAME || "valuedb"}`, (err, db) => {
	if (err) throw err;
	f(db);
    });
}

function count(f) {
    connect(db => {
	db.collection("values").count().then(c => f(c));
	db.close();
    });
}



module.exports = function(o) {
    this.add("role:entitiesQuery, domain:values, cmd:list", (m, r) => {
	const seneca = this;
	
	let p = {};
	if (!m.params) m.params = {};
	
	if (m.params.take) p.limit$ = m.params.take + (m.params.skip || 0);

	console.log("Using query params", p);

	count(function(totalCount) {
	    console.log("Count is " + totalCount);
	    seneca.make("value").list$(
		p, (err, res) => {
		    let result = {
			params: m.params,
			totalCount: totalCount,
			data:  _.map(skip(res, m.params.skip), i => i.data$(false))
		    };
		    
		    r(err, result);
		});
	    
	});
	
    });

    this.add("role:entitiesQuery, domain:values, cmd:fetch", (m, r) => {
	const value = this.make("value");
	const seneca = this;
	
	value.list$({ id: m.id }, function(err, res) {
	    if (err) return r(err);

	    if (res && res.length === 1) {
		return r(null, res[0].data$(false) );
	    }
	    else {
		return r(null, { err: "unknownid" });
	    }
	});
    });
};
