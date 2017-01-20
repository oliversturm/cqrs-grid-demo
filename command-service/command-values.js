const MongoClient = require("mongodb").MongoClient;

function Sem() {
    return {
	queue: [],
	blocked: false,
	acquire: function(f) {
	    if (!this.blocked) {
		this.blocked = true;
		this.call(f);
	    }
	    else this.queue.push(f);
	},
	release: function() {
	    const next = this.queue.shift();
	    if (next === undefined) this.blocked = false;
	    else this.call(next);
	},
	call: function(f) {
	    let released = false;
	    const that = this;
	    
	    f(() => {
		if (!released) {
		    released = true;
		    that.release();
		}
	    });
	}
    };
}

module.exports = function(o) {
    const db = (function() {
	let connectedDb = o.connectedDb;
	const sem = Sem();
	
	return function(f) {
	    sem.acquire(release => {
		if (connectedDb) {
		    f(connectedDb);
		    release();
		}
		else {
		    MongoClient.connect(`mongodb://${o.mongoHost || process.env.MONGO_HOST || "mongo"}:${o.mongoPort || process.env.MONGO_PORT || 27017}/${o.mongoDbName || process.env.MONGO_DBNAME || "valuedb"}`, (err, db) => {
			if (err) throw err;
			connectedDb = db;
			f(connectedDb);
			release();
		    });
		}
	    });
	};
    })();
    
    this.add("role:entitiesCommand, domain:values, cmd:create", (m, r) => {
	const seneca = this;
	
	seneca.act({
	    role: "validation",
	    domain: "values",
	    cmd: "validateOne",
	    instance: m.instance
	}, (err, res) => {
	    if (err) r(err);
	    if (res.valid) {
		db(db => db.collection("values").insertOne(m.instance, (err, res) => {
		    if (err) r(null, { err: err });
		    else r(null, { id: res.insertedId.toHexString() });
		}));
	    }
	    else {
		r(null, { err$: "invalid" });
	    }
	});
    });

    this.add("role:entitiesCommand, domain:values, cmd:update", (m, r) => {
	const seneca = this;
	
	seneca.act({
	    role: "validation",
	    domain: "values",
	    cmd: "validateOne",
	    instance: m.instance,
	    allowIncomplete: true
	}, (err, res) => {
	    if (err) r(err);
	    else if (res.valid) {
		db(db => db.collection("values").
			updateOne({ _id: m.id },
				  { $set: m.instance }, null, (err, res) => {
				      if (err) r(null, { err: err });
				      else if (res.modifiedCount == 0) {
					  r(null, { err: "unknownid" });
				      }
				      else r();
				  }));
	    }
	    else r(null, { err$: "invalid" });
	});
    });
};
