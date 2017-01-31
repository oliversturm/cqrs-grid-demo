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
    
    function createGroupingPipeline(selector, desc, includeDataItems, countingSeparately) {
	let pipeline = [
	    {
    		$group: {
    		    // must use _id at this point for the group key
    		    _id: "$" + selector
    		}
    	    },
    	    {
    		$project: {
    		    // rename _id to key
    		    _id: 0,
    		    key: "$_id"
    		}
    	    },
	    {
		$sort: {
		    key: desc ? -1 : 1
		}
	    }
	];

	if (!countingSeparately) {
	    // this method of counting results in the number of data items in the group
	    // if the group has sub-groups, it can't be used
	    pipeline[0].$group.count = {
		$sum: 1
	    };
	    pipeline[1].$project.count = 1;
	}
	
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

    function createFilterPipeline(filter) {
	console.log("Creating filter pipeline for param", filter);

	if (filter) {
	    return [{
		$match: parseFilter(filter) 
	    }];
	}
	else return [];
    }
    
    async function queryGroupData(collection, selector, desc, includeDataItems, countSeparately,
				  filterPipeline, skipTakePipeline, matchPipeline) {
	const pipeline = filterPipeline.concat(
	    matchPipeline,
	    createGroupingPipeline(selector, desc, includeDataItems, countSeparately),
	    skipTakePipeline
	);
	console.log("Using pipeline: ", JSON.stringify(pipeline));
	
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
	const separateCountRequired = !lastGroup;
	const subGroupsRequired = (!lastGroup) && group.isExpanded;
	
	const groupData = await queryGroupData(collection, group.selector, group.desc,
					       itemDataRequired, separateCountRequired,
					       filterPipeline, skipTakePipeline, matchPipeline);
	if (subGroupsRequired) {
	    for (const groupDataItem of groupData) {
		groupDataItem.items = await queryGroup(
		    collection, params, groupIndex + 1,
		    filterPipeline, // used unchanged in lower levels
		    [], // skip/take doesn't apply on lower levels - correct?
		    // matchPipeline modified to filter down into group level
		    matchPipeline.concat(createMatchPipeline(group.selector, groupDataItem.key)));
		groupDataItem.count = groupDataItem.items.length;
	    }
	}
	else if (separateCountRequired) {
	    // We need to count separately because this is not the lowest level group,
	    // but since we didn't query details about our nested group, we can't just go
	    // for the length of the result array. An extra query is required in this case.
	    // Even though the count is a type of summary for the group, it is special - different
	    // from other group level summaries. The difference is that for each group, a summary
	    // is usually calculated with its data, even if that data isn't actually visible in the
	    // UI at the time. The count on the other hand is meant to represent the number of
	    // elements in the group, and in case these elements are sub-groups instead of data
	    // items, count represents a value that must not be calculated using the data items.

	    const nextGroup = params.group[groupIndex + 1];
	    for (const groupDataItem of groupData) {
		const pipeline = filterPipeline.concat(
		    matchPipeline.concat(createMatchPipeline(group.selector, groupDataItem.key)),
		    createGroupingPipeline(nextGroup.selector, nextGroup.desc, false, true),
		    createCountPipeline()
		);
		groupDataItem.count = await getCount(collection, pipeline);
	    }
	}

	return groupData;
    }

    async function getCount(collection, pipeline) {
	return tryy(
	    async () => {
		const coll = await collection.aggregate(pipeline).toArray();
		// Strangely, the pipeline returns an empty array when the "match" part
		// filters out all rows - I would expect to still see the "count" stage
		// working, but it doesn't. Ask mongo.
		return coll.length > 0 ? coll[0].count : 0;
	    },
	    (err) => console.log("Error counting with pipeline", pipeline, err)
	);
    }
    
    async function queryGroups(collection, params) {
	const filterPipeline = createFilterPipeline(params.filter);
	const skipTakePipeline = createSkipTakePipeline(params.skip, params.take);

	let result = {
	    data: await tryy(
		() => queryGroup(collection, params, 0, filterPipeline, skipTakePipeline),
		(err) => console.log("Error querying top level group data", err)
	    )
	};

	if (params.requireGroupCount) {
	    const group = params.group[0];
	    const groupCountPipeline = filterPipeline.concat(
		createGroupingPipeline(group.selector, group.desc, false),
		createCountPipeline());
	    result.groupCount = await getCount(collection, groupCountPipeline);
	}

	if (params.requireTotalCount) {
	    const totalCountPipeline = filterPipeline.concat(
		createCountPipeline()
	    );
	    result.totalCount = await getCount(collection, totalCountPipeline);
	}
	
	return result;
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

    function createSortPipeline(sort) {
	if (sort) {
	    let sorting = {};
	    for (const sf of sort) sorting[sf.selector] = sf.desc ? -1 : 1;
	    return [{
		$sort: sorting
	    }];
	}
	else return [];
    }

    function createSummaryPipeline(summary) {
	if (summary) {
	    let gc = { _id: null };
	    for (const s of summary) {
		switch(s.summaryType) {
		case "sum":
		    gc["_sum_" + s.selector] = { $sum: "$" + s.selector };
		    break;
		case "avg":
		    gc["_avg_" + s.selector] = { $avg: "$" + s.selector };
		    break;
		case "min":
		    gc["_min_" + s.selector] = { $min: "$" + s.selector };
		    break;
		case "max":
		    gc["_max_" + s.selector] = { $max: "$" + s.selector };
		    break;
		case "count":
		    gc._count = { $sum: 1 };
		    break;
		}
	    }
	    return [{
		$group: gc
	    }];
	}
	else return [];
    }

    function populateSummaryResults(target, summary, summaryResults) {
	if (summary) {
	    target.summary = [];
	    
	    for (const s of summary) {
		switch(s.summaryType) {
		case "sum":
		    target.summary.push(summaryResults["_sum_" + s.selector]);
		    break;
		case "avg":
		    target.summary.push(summaryResults["_avg_" + s.selector]);
		    break;
		case "min":
		    target.summary.push(summaryResults["_min_" + s.selector]);
		    break;
		case "max":
		    target.summary.push(summaryResults["_max_" + s.selector]);
		    break;
		case "count":
		    target.summary.push(summaryResults._count);
		    break;
		}
	    }
	}
    }
    
    async function querySimple(collection, params = {}) {
	const filterPipeline = createFilterPipeline(params.filter);
	const sortPipeline = createSortPipeline(params.sort);
	const skipTakePipeline = createSkipTakePipeline(params.skip, params.take);

	const dataPipeline = filterPipeline.concat(sortPipeline, skipTakePipeline);

	console.log("Data pipeline", JSON.stringify(dataPipeline));
	
	let resultObject = {
	    data: (await collection.aggregate(dataPipeline).toArray()).map(replaceId)
	};

	if (params.requireTotalCount) {
	    const countPipeline = filterPipeline.concat(createCountPipeline());
	    resultObject.totalCount = await getCount(collection, countPipeline);
	}

	if (params.totalSummary) {
	    const summaryPipeline = filterPipeline.concat(createSummaryPipeline(params.totalSummary));
	    console.log("total summary pipeline", JSON.stringify(summaryPipeline));
	    
	    populateSummaryResults(resultObject, params.totalSummary,
				   (await collection.aggregate(summaryPipeline).toArray())[0]);
	}
	
	return resultObject;
    }	

    function sendResult(queryResult, params = {}, r) {
	let reply = {
	    params: params,
	    totalCount: queryResult.totalCount,
	    groupCount: queryResult.groupCount,
	    data: queryResult.data,
	    summary: queryResult.summary
	};

	r(null, reply);
    }

    this.add("role:entitiesQuery, domain:values, cmd:list", (m, r) => {
	m = fixObject(m);

	console.log("Query params: ", m.params);
	
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
