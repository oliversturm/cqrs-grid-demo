import jqueryParam from 'jquery-param';

const getSortingParams = loadOptions =>
  loadOptions.sorting && loadOptions.sorting.length > 0
    ? {
        sort: loadOptions.sorting.map(s => ({
          selector: s.columnName,
          desc: s.direction === 'desc'
        }))
      }
    : {};

const getPagingParams = loadOptions => {
  const params = {};
  if (loadOptions.pageSize) {
    params.take = loadOptions.pageSize;
    params.requireTotalCount = true;
  }
  if (loadOptions.currentPage > 0)
    params.skip = loadOptions.currentPage * loadOptions.pageSize;
  return params;
};

const createQueryURL = (baseUrl, loadOptions) => {
  const params = Object.assign.apply({}, [
    getSortingParams(loadOptions),
    getPagingParams(loadOptions)
  ]);

  const query = jqueryParam(params);
  return query ? baseUrl.concat('?', query) : baseUrl;
};

const convertResponseData = data => ({
  rows: data.data,
  totalCount: data.totalCount
});

export { createQueryURL, convertResponseData };
