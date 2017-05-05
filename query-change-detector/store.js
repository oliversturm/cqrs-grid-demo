module.exports = function() {
  const content = {};

  return {
    register(id, queryParams) {
      if (!id || !queryParams)
        console.error(
          `Store can't register id ${id} with params ${JSON.stringify(queryParams)}`
        );

      console.log('Store registering id ', id);

      if (!queryParams.group) {
        content[id] = queryParams;
        return true;
      } else return false;
    },

    ids() {
      const result = Object.getOwnPropertyNames(content);
      console.log('Store returning ids ', result);
      return result;
    },

    get(id) {
      return content[id];
    }
  };
};
