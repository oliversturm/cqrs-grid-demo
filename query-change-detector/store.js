module.exports = function() {
  const content = {};

  return {
    register(id, idFieldName, aggregateName, queryMessage, notifyForAnyChange) {
      if (
        !id ||
        !queryMessage ||
        !idFieldName ||
        (!aggregateName && !notifyForAnyChange)
      ) {
        console.error(
          `Store can't register id ${id}, idFieldName ${idFieldName}, aggregateName ${aggregateName} with params ${JSON.stringify(queryMessage)}`
        );
        return false;
      }

      content[id] = {
        idFieldName,
        aggregateName,
        queryMessage,
        notifyForAnyChange
      };
      return true;
    },

    deregister(id) {
      delete content[id];
    },

    ids() {
      return Object.getOwnPropertyNames(content);
    },

    get(id) {
      return content[id];
    }
  };
};