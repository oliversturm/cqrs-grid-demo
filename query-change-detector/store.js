module.exports = function() {
  const content = {};

  return {
    register(id, idFieldName, queryParams) {
      if (!id || !queryParams || !idFieldName)
        console.error(
          `Store can't register id ${id}, idFieldName ${idFieldName} with params ${JSON.stringify(queryParams)}`
        );

      //console.log('Store registering id ', id);

      if (!queryParams.group) {
        content[id] = {
          idFieldName,
          queryParams
        };
        return true;
      } else return false;
    },

    deregister(id) {
      delete content[id];
    },

    ids() {
      const result = Object.getOwnPropertyNames(content);
      return result;
    },

    get(id) {
      return content[id];
    }
  };
};
