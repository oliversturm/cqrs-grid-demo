import qs from 'qs';
const _ = require('lodash');

const BASEDATA = '//localhost:3000/data/v1/values';
var BASEAPI = '//localhost:3000/api/v1';

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
  if (loadOptions.pageSize) params.take = loadOptions.pageSize;
  if (loadOptions.currentPage > 0)
    params.skip = loadOptions.currentPage * loadOptions.pageSize;
  return params;
};

const getFilterParams = loadOptions =>
  loadOptions.filters && loadOptions.filters.length > 0
    ? {
        filter: loadOptions.filters.reduce((r, v) => {
          if (r.length > 0) r.push('and');
          r.push([v.columnName, '=', v.value]);
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
        requireGroupCount: true,
        skip: undefined,
        take: undefined // always query all groups
      }
    : {};

const createQueryURL = (baseUrl, loadOptions) => {
  const params = Object.assign.apply({}, [
    getSortingParams(loadOptions),
    getPagingParams(loadOptions),
    getFilterParams(loadOptions),
    getGroupParams(loadOptions), // overrides skip and take
    {
      tzOffset: new Date().getTimezoneOffset()
    }
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

const createExpandedGroupsString = expandedGroups =>
  expandedGroups ? expandedGroups.join(',') : undefined;

const createGroupQueryData = (data, loadOptions) => {
  const isExpanded = groupKey => loadOptions.expandedGroups.includes(groupKey);
  const furtherGroupLevels = groupLevel =>
    groupLevel + 1 < loadOptions.grouping.length;

  let cqTotalCount = 0;
  let totalCount = 0;
  // page range: if totalCount is >= pageRangeStart and < pageRangeEnd
  // *before* the yield, then we yield
  const pageRangeStart =
    loadOptions.currentPage >= 0 && loadOptions.pageSize
      ? loadOptions.currentPage * loadOptions.pageSize
      : undefined;
  const pageRangeEnd =
    pageRangeStart >= 0 ? pageRangeStart + loadOptions.pageSize : undefined;

  function countInPageRange(count) {
    return pageRangeStart >= 0
      ? count >= pageRangeStart && count < pageRangeEnd
      : true;
  }

  function groupContentOverlapsPageRange(groupStart, groupLength) {
    return pageRangeStart >= 0
      ? groupStart < pageRangeEnd && groupStart + groupLength >= pageRangeStart
      : true;
  }

  function* generateContentQueries(
    list,
    groupLevel = 0,
    parentGroupKey,
    parentFilters = []
  ) {
    function getParentFilters(group) {
      return [
        ...parentFilters,
        {
          columnName: loadOptions.grouping[groupLevel].columnName,
          value: group.key
        }
      ];
    }

    function countRow(hasRowsParent) {
      // represents yielding a cont row
      if (hasRowsParent && isPageBoundary(cqTotalCount)) cqTotalCount++;
      // yielding the row itself
      cqTotalCount++;
    }

    function countRows(c, hasRowsParent) {
      for (let i = 0; i < c; i++) countRow(hasRowsParent);
    }

    for (let group of list) {
      countRow(!!parentGroupKey);
      const groupKey = (parentGroupKey ? `${parentGroupKey}|` : '') + group.key;
      if (isExpanded(groupKey)) {
        //console.log('Found expanded group: ', groupKey);
        if (furtherGroupLevels(groupLevel))
          yield* generateContentQueries(
            group.items,
            groupLevel + 1,
            groupKey,
            getParentFilters(group)
          );
        else {
          if (groupContentOverlapsPageRange(cqTotalCount, group.count))
            yield {
              groupKey,
              queryString: createQueryURL(BASEDATA, {
                sorting: loadOptions.sorting,
                // not passing paging options
                filters: loadOptions.filters.concat(getParentFilters(group))
              })
            };
          countRows(group.count, !!group);
        }
      }
    }
  }

  function isPageBoundary(count) {
    const fraction = count / loadOptions.pageSize;
    return fraction > 0 && fraction === Math.trunc(fraction);
  }

  function* generateRows(list, contentData, groupLevel = 0, parentGroupRow) {
    function* yieldRow(row, rowsParent) {
      // rowsParent is the actual parent group row for this row -
      // it differs from parentGroupRow on the generateRows function in
      // that content rows of top-level groups have a rowsParent, but
      // no parentGroupRow.

      if (rowsParent && isPageBoundary(totalCount)) {
        const contRow = Object.assign({}, rowsParent, {
          value: `${rowsParent.value} continued...`,
          column: rowsParent.column
        });
        if (countInPageRange(totalCount)) yield contRow;
        totalCount++;
      }

      // now yield the actual row
      if (countInPageRange(totalCount)) yield row;
      totalCount++;
    }

    function createGroupRow(group) {
      return {
        // With CustomGrouping, the key needs to be just the group key
        // itself, no longer the full key that contains parent elements.
        // However, we need the parent part as well, because it's used
        // to look up separately loaded group data.
        fullKey:
          (parentGroupRow ? `${parentGroupRow.fullKey}|` : '') + `${group.key}`,
        key: `${group.key}`,
        groupedBy: loadOptions.grouping[groupLevel].columnName,
        value: group.key,
        type: 'groupRow'
      };
    }

    function* getGroupContent(groupRow, contentData, itemCount) {
      // console.log(
      //   `getGroupContent with key ${groupRow.fullKey}, contentData`,
      //   contentData
      // );
      const cd = contentData.find(c => c.groupKey === groupRow.fullKey);
      if (cd) {
        // optimization idea: only query as many content records
        // as will fit on the page, then yield dummy rows for the
        // remainder - currently I'm still doing a full query for
        // content, even if part of it won't be visible.
        for (let row of cd.content) yield* yieldRow(row, groupRow);
      } else {
        // no content found for this expanded group means no
        // query was run, which means that this group content
        // is not visible on the current page
        // to count properly, I'll just yield dummy rows instead
        for (let i = 0; i < itemCount; i++) yield* yieldRow(null, groupRow);
      }
    }

    for (let group of list) {
      // Top group row
      const groupRow = createGroupRow(group);
      yield* yieldRow(groupRow, parentGroupRow);

      // Is the group expanded?
      if (isExpanded(groupRow.fullKey)) {
        // Are there further group levels?
        if (furtherGroupLevels(groupLevel)) {
          yield* generateRows(
            group.items,
            contentData,
            groupLevel + 1,
            groupRow
          );
        } else {
          // Now we need to return the group content
          yield* getGroupContent(groupRow, contentData, group.count);
        }
      }
    }
  }

  function getContentData(groups) {
    const queries = Array.from(generateContentQueries(groups)).map(q =>
      simpleQuery(q.queryString).then(res => ({
        groupKey: q.groupKey,
        content: res.dataFetched ? res.data.rows : undefined
      }))
    );

    return Promise.all(queries);
  }

  return getContentData(data.data).then(contentData => ({
    rows: Array.from(generateRows(data.data, contentData)),
    totalCount
  }));
};

const simpleQuery = queryUrl => {
  return fetch(queryUrl)
    .then(response => response.json())
    .then(data => {
      console.log('Received simple data: ', data);

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

// Algorithm for group queries:
// - construct query url with group parameters, setting all groups to
//   isExpanded false (so no detail data will be returned), and
//   skip and take to undefined (I'm not completely sure why this is
//   important - perhaps it could be optimized) (createQueryURL)
// - query data on query url, this returns all groups on all levels
// - generate content queries by iterating over group list, counting rows
//   required per group, taking into account page size and current page,
//   and yielding simple query URLs for the groups that are visible at
//   least partly on the current page (createContentQueries)
// - execute the detail queries (getContentData)
// - (generateRows) Iterate group data recursively, counting carefully
//   the number of rows actually yielded (yieldRow). Data from the detail
//   queries is pulled from the result sets at the right point (getGroupContent)

const groupQuery = (queryUrl, loadOptions) => {
  return fetch(queryUrl)
    .then(response => response.json())
    .then(data => {
      console.log('Received group data: ', data);

      return createGroupQueryData(data, loadOptions).then(data => ({
        dataFetched: true,
        data
      }));
    })
    .catch(reason => ({
      dataFetched: false,
      reason
    }));
};

const fetchData = (() => {
  let lastQueryDetails;

  return loadOptions => {
    const queryUrl = createQueryURL(BASEDATA, loadOptions);
    const expandedGroupsString = createExpandedGroupsString(
      loadOptions.expandedGroups
    );

    return new Promise(resolve => {
      const thisQueryDetails = {
        queryUrl,
        expandedGroupsString,
        pageSize: loadOptions.pageSize,
        currentPage: loadOptions.currentPage
      };
      if (loadOptions.force || !_.isMatch(lastQueryDetails, thisQueryDetails)) {
        console.log('Querying (decoded): ', decodeURIComponent(queryUrl));

        (loadOptions.grouping && loadOptions.grouping.length > 0
          ? groupQuery(queryUrl, loadOptions)
          : simpleQuery(queryUrl)
        ).then(result => {
          if (result.dataFetched) lastQueryDetails = thisQueryDetails;

          resolve(result);
        });
      } else resolve({ dataFetched: false });
    });
  };
})();

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
  const url = BASEDATA + (add ? '' : `/${key}`);
  fetch(url, params).catch(r =>
    console.log('Something went wrong POSTing this row: ', row)
  );
}

const commitChanges = ({ added, changed, deleted }) => {
  console.log('committing added: ', added);
  console.log('committing changes: ', changed);

  if (added && added.length > 0) for (const row of added) sendChange(row);
  if (changed) for (const key in changed) sendChange(changed[key], false, key);
};

const createTestData = () => {
  fetch(BASEAPI + '/createTestData?count=' + encodeURIComponent(1000));
};

export { fetchData, commitChanges, createTestData };
