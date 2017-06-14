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
          isExpanded: false
        })),
        requireGroupCount: true
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

const convertSimpleQueryData = data => ({
  rows: data.data,
  totalCount: data.totalCount
});

const createGroupQueryData = (data, loadOptions) => {
  function recurse(source, groupLevel, parentGroup, parentFilters = []) {
    function createGroupNode(group) {
      return {
        _headerKey: `groupRow_${loadOptions.grouping[groupLevel].columnName}`,
        key: (parentGroup ? `${parentGroup.key}|` : '') + `${group.key}`,
        colspan: parentGroup ? parentGroup.colspan + 1 : 1,
        value: group.key,
        type: 'groupRow',
        column: {
          name: loadOptions.grouping[groupLevel].columnName,
          title: loadOptions.grouping[groupLevel].columnName
        },
        rows: []
      };
    }

    function getParentFilter(group) {
      return {
        columnName: loadOptions.grouping[groupLevel].columnName,
        value: group.key
      };
    }

    function getParentFilters(group) {
      return [...parentFilters, getParentFilter(group)];
    }

    function getNestedElements(group, newGroup) {
      return new Promise((resolve, reject) => {
        if (loadOptions.expandedGroups.includes(newGroup.key)) {
          if (groupLevel + 1 < loadOptions.grouping.length)
            resolve(
              recurse(
                group.items,
                groupLevel + 1,
                newGroup,
                getParentFilters(group)
              )
            );
          else {
            const query = createQueryURL(BASEDATA, {
              sorting: loadOptions.sorting,
              pageSize: loadOptions.pageSize,
              currentPage: 0,
              filters: loadOptions.filters.concat(getParentFilters(group))
            });

            simpleQuery(query).then(res => {
              console.log('Group query result', res);

              if (res.dataFetched) resolve(res.data.rows);
              else reject();
            });
          }
        } else resolve([]);
      });
    }

    return Promise.resolve(
      source.reduce((r, v) => {
        const groupNode = createGroupNode(v);
        return getNestedElements(v, groupNode).then(elements =>
          r.then(list => list.concat([groupNode], elements))
        );
      }, Promise.resolve([]))
    );
  }
  function getRows(list) {
    return recurse(list, 0);
  }

  console.log('Converting response: ', data);

  return new Promise((resolve, reject) => {
    getRows(data.data).then(rows => {
      resolve({ rows, totalCount: data.groupCount });
    });
  });
};

function sendChange(row, add = true, key) {
  console.log(`Sending change with add=${add}, key=${key}: `, row);

  const params = {
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json'
    },
    method: add ? 'POST' : 'PUT',
    body: JSON.stringify(row)
  };
  const url = '//localhost:3000/data/v1/values' + (add ? '' : `/${key}`);
  fetch(url, params).catch(r =>
    console.log('Something went wrong POSTing this row: ', row)
  );
}

const commitChanges = ({ added, changed, deleted }) => {
  console.log('committing changes: ', changed);

  if (added && added.length > 0) for (const row of added) sendChange(row);
  if (changed) for (const key in changed) sendChange(changed[key], false, key);
};

const BASEDATA = '//localhost:3000/data/v1/values';

const simpleQuery = queryUrl => {
  return fetch(queryUrl)
    .then(response => response.json())
    .then(data => {
      return {
        dataFetched: true,
        data: convertSimpleQueryData(data)
      };
    })
    .catch(reason => ({
      dataFetched: false,
      reason
    }));
};

const groupQuery = (queryUrl, loadOptions) => {
  return fetch(queryUrl)
    .then(response => response.json())
    .then(data => {
      return createGroupQueryData(data, loadOptions).then(data => {
        return {
          dataFetched: true,
          data
        };
      });
    })
    .catch(reason => ({
      dataFetched: false,
      reason
    }));
};

const createExpandedGroupsString = expandedGroups =>
  expandedGroups ? expandedGroups.join(',') : undefined;

const fetchData = (() => {
  let lastQueryUrl;
  let lastExpandedGroups;

  return loadOptions => {
    const queryUrl = createQueryURL(BASEDATA, loadOptions);
    const expandedGroupsString = createExpandedGroupsString(
      loadOptions.expandedGroups
    );

    return new Promise((resolve, reject) => {
      if (
        !(queryUrl === lastQueryUrl) ||
        !(expandedGroupsString === lastExpandedGroups)
      ) {
        console.log('Querying (decoded): ', decodeURIComponent(queryUrl));

        (loadOptions.grouping && loadOptions.grouping.length > 0
          ? groupQuery(queryUrl, loadOptions)
          : simpleQuery(queryUrl)).then(result => {
          if (result.dataFetched) {
            lastQueryUrl = queryUrl;
            lastExpandedGroups = expandedGroupsString;
          }
          resolve(result);
        });
      } else resolve({ dataFetched: false });
    });
  };
})();

export { fetchData, commitChanges };
