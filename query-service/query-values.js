const mongodb = require("mongodb");
const ObjectID = mongodb.ObjectID;

const fixObject = require("../message-utils").fixObject;

const query = require("devextreme-query-mongodb");

module.exports = function(o = {}) {
    const db = require("../db")(o);

    this.add("role:entitiesQuery, domain:values, cmd:list", (m, r) => {
	m = fixObject(m);

	//console.log("Query params: ", m.params);
	
	db(async (db) => {
	    try {
		r(null, await query(db.collection("values"),
                                    m.params,
                                    { replaceIds: false }));
	    }
	    catch(err) {
		r(null, { err$: err });
	    }
	});
    });
	
	
    this.add("role:entitiesQuery, domain:values, cmd:fetch", (m, r) => {
	db(async (db) => {
	    try {
		const res = await db.collection("values").findOne({ _id: new ObjectID(m.id) });
		if (res) r(null, res);
		else r(null, { err$: "unknownid" });
	    }
	    catch(err) {
		r(null, { err$: err });
	    }
	});
    });
};
