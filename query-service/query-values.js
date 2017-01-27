const mongodb = require("mongodb");
const ObjectID = mongodb.ObjectID;
const tryy = require("try-expression");

const fixObject = require("../message-utils").fixObject;

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
    
    function createGroupingPipeline(selector, desc, includeDataItems) {
	let pipeline = [
	    {
    		$group: {
    		    // must use _id at this point for the group key
    		    _id: "$" + selector,
    		    count: {
    			$sum: 1
    		    }
    		}
    	    },
    	    {
    		$project: {
    		    // rename _id to key
    		    _id: 0,
    		    key: "$_id",
    		    count: 1
    		}
    	    },
	    {
		$sort: {
		    key: desc ? -1 : 1
		}
	    }
	];
    
	
    	if (includeDataItems) {
    	    // include items directly if we're expected to do so, and if this is the
    	    // most deeply nested group in case there are several
    	    pipeline[0].$group.items = {
    		$push: "$$CURRENT"
    	    };
    	    pipeline[1].$project.items = 1;
    	}
    	else {
    	    // add null items field otherwise
    	    pipeline.push({
    		$addFields: {
    		    items: null // only null works, not [] or leaving out items altogether
    		}
    	    });
    	}

	return pipeline;
    }

    function createSkipTakePipeline(skip, take) {
	let pipeline = [];
	
	if (skip) pipeline.push({
    	    $skip: skip
    	});
    	if (take) pipeline.push({
    	    $limit: take
    	});

	return pipeline;
    }

    function createCountPipeline() {
	return [{
	    $count: "count"
	}];
    }
    
    function createMatchPipeline(selector, value) {
	let match = {
	    $match: {}
	};
	match.$match[selector] = value;
	return [match];
    }

    function createFilterPipeline(filterParam) {
	console.log("Creating filter pipeline for param", filterParam);

	if (filterParam) {
	    return [{
		$match: parseFilter(filterParam) 
	    }];
	}
	else return [];
    }
    
    async function queryGroupData(collection, selector, desc, includeDataItems,
				  filterPipeline, skipTakePipeline, matchPipeline) {
	const pipeline = filterPipeline.concat(
	    matchPipeline,
	    createGroupingPipeline(selector, desc, includeDataItems),
	    skipTakePipeline
	);
	const groupData = await collection.aggregate(pipeline).toArray();
	if (includeDataItems) {
	    for (const groupItem of groupData) {
		groupItem.items = groupItem.items.map(replaceId);
	    }
	}
	return groupData;
    }
    
    async function queryGroup(collection, params, groupIndex,
			      filterPipeline = [], skipTakePipeline = [], matchPipeline=[]) {
	const group = params.group[groupIndex];
	const lastGroup = groupIndex === params.group.length - 1;
	const itemDataRequired = lastGroup && group.isExpanded;
	const subGroupsRequired = (!lastGroup) && group.isExpanded;
	
	const groupData = await queryGroupData(collection, group.selector, group.desc,
					       itemDataRequired, filterPipeline,
					       skipTakePipeline, matchPipeline);
	if (subGroupsRequired) {
	    for (const groupDataItem of groupData) {
		groupDataItem.items = await queryGroup(
		    collection, params, groupIndex + 1,
		    matchPipeline.concat(createMatchPipeline(group.selector, groupDataItem.key)));
	    }
	}

	return groupData;
    }
    
    async function queryGroups(collection, params) {
	console.log("Querying groups");
	
	const filterPipeline = createFilterPipeline(params.filter);
	console.log("Got filter pipeline", filterPipeline);
	
	const skipTakePipeline = createSkipTakePipeline(params.skip, params.take);
	console.log("Got skip/take pipeline", skipTakePipeline);

	const topLevelGroupData = await tryy(
	    () => queryGroup(collection, params, 0, filterPipeline, skipTakePipeline),
	    (err) => console.log("Error querying top level group data", err)
	);
	
	console.log("Top level group data", topLevelGroupData);
	
	const group = params.group[0];
	const groupCountPipeline = filterPipeline.concat(
	    createGroupingPipeline(group.selector, group.desc, false),
	    createCountPipeline());
	console.log("count pipeline", groupCountPipeline);

	const groupCount = await tryy(
	    async () => (await collection.aggregate(groupCountPipeline).toArray())[0].count,
	    (err) => console.log("Error counting groups", err)
	);
	
	console.log("Group Count: ", groupCount);

	const totalCountPipeline = filterPipeline.concat(
	    createCountPipeline()
	);
	
	const totalCount = await tryy(
	    async () => (await collection.aggregate(totalCountPipeline).toArray())[0].count,
	    (err) => console.log("Error counting total", err)
	);
	
	return {
	    data: topLevelGroupData,
	    groupCount: groupCount,
	    totalCount: totalCount
	};
    }

    function parseFilter(element) {
	// Element can be a string denoting a field name - I don't know if that's a case
	// supported by the widgets in any way, but it seems conceivable that somebody constructs
	// an expression like [ "!", "boolValueField" ]
	// In the string case, I return a truth-checking filter.
	//
	// Otherwise, element can be an array with two items
	// For two items:
	// 0: unary operator
	// 1: operand
	//
	// Otherwise, element can be an element with an odd number of items
	// For three items:
	// 0: operand 1 - this is described as the "getter" in the docs - i.e. field name -
	//    but in the cases of "and" and "or" it could be another nested element
	// 1: operator
	// 2: operand 2 - the value for comparison - for "and" and "or" can be a nested element
	//
	// For more than three items, it's assumed that this is a chain of "or" or "and" -
	// either one or the other, no combinations
	// 0: operand 1
	// 1: "or" or "and"
	// 2: operand 2
	// 3: "or" or "and" - must be the same as (1)
	// 4: operand 3
	// .... etc
	//

	function error(msg) {
	    throw msg + " Element: " + JSON.stringify(element);
	}

	function construct(fieldName, operator, compValue) {
	    let result = {};
	    result[fieldName] = {};
	    result[fieldName][operator] = compValue;
	    return result;
	}

	function constructRegex(fieldName, regex) {
	    let result = {};
	    result[fieldName] = {
		$regex: regex,
		$options: "" // "i" for case-insensitive?
	    };
	    return result;
	}

	if (typeof element === "string") {
	    return construct(element, "$eq", true);
	}
	else if (element.length) {
	    if (element.length === 2) {
		// unary operator - only one supported
		if (element[0] === "!") {
		    return {
			$nor: [
			    parseFilter(element[1])
			]
		    };
		}
		else return error("Unsupported unary operator");
	    }
	    else if ((element.length % 2) === 1) {
		// odd number of elements - let's see what the operator is
		const operator = element[1].toLowerCase();
		
		if (["and", "or"].includes(operator)) {
		    if (element.reduce((r, v) => {
			if (r.previous) return { ok: r.ok, previous: false };
			else return { ok: r.ok && v.toLowerCase() === operator, previous: true };
		    }, { ok: true, previous: true }).ok) {
			// all operators are the same
			let result = {};
			result["$" + operator] =
			    (element.reduce((r, v) => {
				if (r.previous) return { list: r.list, previous: false };
				else {
				    r.list.push(parseFilter(v));
				    return { list: r.list, previous: true };
				}
			    }, { list: [], previous: false })).list;
			
			return result;
		    }
		    else return error(
			"Operator chain had non-matching operators (should be '" + operator + "')");
		}
		else {
		    if (element.length === 3) {
			switch(operator) {
			case "=":
			    return construct(element[0], "$eq", element[2]);
			case "<>":
			    return construct(element[0], "$ne", element[2]);
			case ">":
			    return construct(element[0], "$gt", element[2]);
			case ">=":
			    return construct(element[0], "$gte", element[2]);
			case "<":
			    return construct(element[0], "$lt", element[2]);
			case "<=":
			    return construct(element[0], "$lte", element[2]);
			case "startswith":
			    return constructRegex(element[0], "^" + element[2]);
			case "endswith":
			    return constructRegex(element[0], element[2] + "$");
			case "contains":
			    return constructRegex(element[0], element[2]);
			case "notcontains":
			    return constructRegex(element[0], "^((?!" + element[2] + ").)*$");
			default: return error("Unknown operator");
			}
		    }
		    else return error("Operator filter of unsupported length");
		}
	    }
	    else return error("Array element of unsupported length");
	}
	else return error("Element type unknown");
    }
    
    async function querySimple(collection, params = {}) {
	const criteria =
		  params.filter ? parseFilter(params.filter) : {};
	
	let results = collection.find(criteria);

	const totalCount = await tryy(
	    () => results.count(),
	    (err) => console.log("Counting error: ", err)
	);

	console.log("Got totalCount", totalCount);
	
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

	return {
	    totalCount: totalCount,
	    data: (await results.toArray()).map(replaceId)
	};
    }	

    function sendResult(queryResult, params = {}, r) {
	let reply = {
	    params: params,
	    totalCount: queryResult.totalCount,
	    groupCount: queryResult.groupCount,
	    data: queryResult.data
	};

	r(null, reply);
    }

    this.add("role:entitiesQuery, domain:values, cmd:list", (m, r) => {
	m = fixObject(m);

	db(async (db) => {
	    const collection = db.collection("values");

	    try {
		const queryResult =
			  m.params && m.params.group && m.params.group.length > 0 ?
			  await queryGroups(collection, m.params) :
			  await querySimple(collection, m.params);
		
		sendResult(queryResult, m.params, r);
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
		if (res) r(null, replaceId(res));
		else r(null, { err$: "unknownid" });
	    }
	    catch(err) {
		r(null, { err$: err });
	    }
	});
    });
};
