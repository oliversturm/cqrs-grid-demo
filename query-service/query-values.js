const mongodb = require("mongodb");
const ObjectID = mongodb.ObjectID;

module.exports = function(o = {}) {
    const db = require("../db")(o);

    // I don't want mongo formatted ids getting out of this service -
    // that's an implementation detail. However, mongo doesn't seem
    // to have the ability of simply returning its ids as strings
    // to begin with. Bit of a pita, but hey...
    function replaceId(item) {
	item._id = item._id.toHexString();
	return item;
    }
    
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
			data: res.map(replaceId)
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
		else if (res) r(null, replaceId(res));
		else r(null, { err$: "unknownid" });
	    });
	});
    });
};
