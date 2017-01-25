const mongodb = require("mongodb");
const ObjectID = mongodb.ObjectID;

module.exports = function(o = {}) {
    const db = require("../db")(o);

    // I don't want mongo formatted ids getting out of this service -
    // that's an implementation detail. However, mongo doesn't seem
    // to have the ability of simply returning its ids as strings
    // to begin with. Bit of a pita, but hey...
    function replaceId(item) {
	if (item._id) item._id = item._id.toHexString();
	return item;
    }

    function queryGroups(collection, params, cont) {
	const group = params.group[0];
	console.log("Using group config: ", group);
	    
	const pipeline = [
	    {
		$group: {
		    _id: "$" + group.selector,
		    count: {
			$sum: 1
		    }//,
		    // items: {
		    //  	$push: "$$CURRENT"
		    // }
		}
	    },
	    {
		$project: {
		    _id: 0,
		    key: "$_id",
		    count: 1,
		    items: 1
		}
	    },
	    {
	    	$addFields: {
		    // if not returning data for top-level groups, this must be null, not []
	    	    items: null
	    	}
	    }
	];
	const countPipeline = pipeline.slice(0);
	countPipeline.push({
	    $count: "groupCount"
	});
	

	if (params.skip) pipeline.push({
	    $skip: params.skip
	});
	if (params.take) pipeline.push({
	    $limit: params.take
	});
	
	console.log("Using pipeline: ", pipeline);
	    

	collection.aggregate(countPipeline, (err, res) => {
	    if (err) throw err;
	    console.log("Counting returned: ", res);
	    
	    const groupCount = res[0].groupCount;
	    collection.aggregate(pipeline, (err, groups) => {
		if (err) throw err;

		if (group.isExpanded) {
		    // in this case, I need to add further details to each group
		    // The items property will need to be either a list of documents
		    // in the group, or a list of sub-groups
		}

		cont( {
		    data: groups,
		    groupCount: groupCount
		} );
	    });
	});
    }
    
    function querySimple(collection, params = {}, cont) {
	let results = collection.find({});
		    
	if (params.sort) {
	    // there is indication that sort may vary in the following ways
	    // that are currently unsupported:
	    // * sort may be a single instance instead of an array
	    // * sort instance may be a string
	    // * sort instance may be a function (but then it wouldn't get into
	    //   this function in the first place)
	    let sorting = {};
	    for (const sf of params.sort) sorting[sf.selector] = sf.desc ? -1 : 1;
	    
	    results = results.sort(sorting);
	}
	
	if (params.skip) results = results.skip(params.skip);
	if (params.take) results = results.limit(params.take);

	results.toArray((err, queryData) => {
	    cont( {
		data: queryData.map(replaceId)
	    } );
	});
    }	

    function sendResult(totalCount, queryResult, params = {}, r) {
	let reply = {
	    params: params,
	    totalCount: totalCount,
	    groupCount: queryResult.groupCount,
	    data: queryResult.data
	};
	
	r(null, reply);
    }

    this.add("role:entitiesQuery, domain:values, cmd:list", (m, r) => {
	db(db => {
	    const collection = db.collection("values");
	    
	    collection.count((err, totalCount) => {
		if (err) r(null, { err$: err });
		
		console.log("Query params: ", m.params);
		
		let result;
		
		function acceptResult(queryResult) {
		    sendResult(totalCount, queryResult, m.params, r);
		}
		
		if (m.params && m.params.group && m.params.group.length > 0) {
		    result = queryGroups(collection, m.params, acceptResult);
		}
		else result = querySimple(collection, m.params, acceptResult);
	    });
	});
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
