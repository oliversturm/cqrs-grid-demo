import qs from 'qs';

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

const getFilterParams = loadOptions =>
  loadOptions.filters && loadOptions.filters.length > 0
    ? {
        filter: loadOptions.filters.reduce((r, v) => {
          // This 'if' is a workaround - items in the filters collection
          // currently stay in the list when the user enters a value
          // in a filter editor and then deletes it again, only the value
          // field is then empty. So I'm currently ignoring filtering
          // items with empty 'value's -- not quite the right way, since
          // I believe empty values could be valid filters.
          if (v.value) {
            if (r.length > 0) r.push('and');
            r.push([
              v.columnName,
              '=',
              v.columnName === 'int1' ? parseInt(v.value, 10) : v.value
            ]);
          }
          return r;
        }, [])
      }
    : {};

const getGroupParams = loadOptions =>
  loadOptions.grouping && loadOptions.grouping.length > 0
    ? {
        group: loadOptions.grouping.map(g => ({
          selector: g.columnName,
          isExpanded: true
        }))
      }
    : {};

const createQueryURL = (baseUrl, loadOptions) => {
  const params = Object.assign.apply({}, [
    getSortingParams(loadOptions),
    getPagingParams(loadOptions),
    getFilterParams(loadOptions),
    getGroupParams(loadOptions)
  ]);

  console.log('Created params: ', params);

  const query = qs.stringify(params, {
    arrayFormat: 'indices'
  });
  return query ? baseUrl.concat('?', query) : baseUrl;
};

const convertResponseData = (data, loadOptions) => {
  function getRows(list, groupLevel, parentGroup) {
    if (list.length > 0) {
      if (list[0].key && list[0].items) {
        // assume this is a group list
        return list.map(g => ({
          _headerKey: `groupRow_${loadOptions.grouping[groupLevel].columnName}`,
          key: (parentGroup ? `${parentGroup.key}|` : '') + `${g.key}`,
          colspan: parentGroup ? parentGroup.colspan + 1 : 0,
          value: g.key,
          type: 'groupRow',
          column: {
            name: loadOptions.grouping[groupLevel].columnName,
            title: loadOptions.grouping[groupLevel].columnName
          },
          rows: getRows(g.items, groupLevel + 1, g)
        }));
      } else return list;
    } else return [];
  }

  console.log('Converting response: ', data);

  let result;

  if (loadOptions.grouping && loadOptions.grouping.length > 0)
    result = { rows: getRows(data.data, 0), totalCount: data.totalCount };
  else result = { rows: data.data, totalCount: data.totalCount };

  console.log('Conversion result: ', result);
  return result;
};

export { createQueryURL, convertResponseData };
