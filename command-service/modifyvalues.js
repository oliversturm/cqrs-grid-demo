module.exports = function(o) {
    this.add({ role: "modifyvalues", cmd: "create" }, (m, r) => {
	const value = this.make("value");
	value.data$(m.instance);
	value.save$(function(err){
	    if (err) this.log.error("Can't save object", m.instance);
	});
	
	r();
    });
};
