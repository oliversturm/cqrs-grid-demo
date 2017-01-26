var regexIso8601 = /^(\d{4}|\+\d{6})(?:-(\d{2})(?:-(\d{2})(?:T(\d{2}):(\d{2}):(\d{2})\.(\d{1,})(Z|([\-+])(\d{2}):(\d{2}))?)?)?)?$/;

function fixDate(value) {
    if (typeof value === "string" && (match = value.match(regexIso8601))) {
	var ms = Date.parse(match[0]);
	if (!isNaN(ms)) {
	    return new Date(ms);
	}
    }
    return value;
}

function fixRecursive(value) {
    if (value != null && typeof value === "object") {
	return fixObject(value);
    }
    return value;
}

const fixers = [
    fixDate,
    fixRecursive
];

function fixValue(value) {
    return fixers.reduce((r, v) => v(r), value);
}

function fixObject(o) {
    for (const f in o) {
	o[f] = fixValue(o[f]);
    }
    return o;
}

module.exports = {
    fixDate,
    fixRecursive,
    fixers,
    fixValue,
    fixObject
};

