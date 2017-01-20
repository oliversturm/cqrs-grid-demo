const mongodb = require("mongodb");
const MongoClient = mongodb.MongoClient;
const ObjectID = mongodb.ObjectID;

module.exports = function(o = {}) {
    const db = (function() {
	let connectedDb = o.connectedDb;
	return function(f) {
	    let result;
	    
	    if (connectedDb) result = f(connectedDb);
	    else {
		console.log("Creating new connection");
		
		MongoClient.connect(`mongodb://${o.mongoHost || process.env.MONGO_HOST || "mongo"}:${o.mongoPort || process.env.MONGO_PORT || 27017}/${o.mongoDbName || process.env.MONGO_DBNAME || "valuedb"}`, (err, db) => {
		    if (err) throw err;
		    connectedDb = db;
		    result = f(connectedDb);
		});
	    }
	    if (result && result.close)
		db.close();
	};
    })();
    
    this.add("role:entitiesQuery, domain:values, cmd:list", (m, r) => {
	db(db => db.collection("values").count((err, totalCount) => {
	    if (err) r(null, { err$: err });
	    
	    let results = db.collection("values").find({});
	    if (m.params){
		if (m.params.skip) results = results.skip(m.params.skip);
		if (m.params.take) results = results.limit(m.params.take);
	    }
	    
	    results.toArray((err, res) => {
		if (err) r(null, { err$: err });
		else {
		    let result = {
			params: m.params,
			totalCount: totalCount,
			data: res
		    };
		    
		    r(null, result);
		}
	    });
	}));
    });
    
    this.add("role:entitiesQuery, domain:values, cmd:fetch", (m, r) => {
	db(db => {
	    db.collection("values").findOne({ _id: new ObjectID(m.id) }, (err, res) => {
		if (err) r(null, { err$: err });
		else if (res) r(null, res);
		else r(null, { err$: "unknownid" });
	    });
	});
    });
};
