module.exports = function() {
  const content = {};

  return {
    register(id, queryParams) {
      if (!queryParams.group) {
        content[id] = queryParams;
        return true;
      } else return false;
    },

    ids() {
      return Object.getOwnPropertyNames(content);
    },

    get(id) {
      return content[id];
    }
  };
};
