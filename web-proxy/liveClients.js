module.exports = function() {
  const content = {};

  return {
    register(id) {
      content[id] = {};
    },

    registerConnection(id, socket) {
      if (!this.hasId(id)) {
        console.error(`Can't register connection for ${id}`);
        return;
      }
      content[id].socket = socket;
    },

    hasId(id) {
      return !!this.get(id);
    },

    get(id) {
      return content[id];
    },

    getSocket(id) {
      return this.get(id).socket;
    }
  };
};
