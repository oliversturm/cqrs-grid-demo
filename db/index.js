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

module.exports = function(options) {
    let connectedDb = options.connectedDb;
    const sem = Sem();
    
    return function(f) {
	sem.acquire(release => {
	    if (connectedDb) {
		f(connectedDb);
		release();
	    }
	    else {
		MongoClient.connect(`mongodb://${options.mongoHost || process.env.MONGO_HOST || "mongo"}:${options.mongoPort || process.env.MONGO_PORT || 27017}/${options.mongoDbName || process.env.MONGO_DBNAME || "valuedb"}`, (err, db) => {
		    if (err) throw err;
		    connectedDb = db;
		    f(connectedDb);
		    release();
		});
	    }
	});
    };
};
