module.exports = function(o) {
    this.add({ role: "modifyvalues", cmd: "create" }, (m, r) => {
	// expect n.newValue to contain new value
	r();
    });
};
