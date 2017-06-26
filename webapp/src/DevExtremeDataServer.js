import React from 'react';

import { Getter, PluginContainer } from '@devexpress/dx-react-core';

import { fetchData } from './data-access';

function dataContext() {
  let previousResult = undefined;
  let loadingPromise = undefined;

  return {
    getRows(sorting, currentPage, pageSize, filters, grouping, expandedGroups) {
      const loadOptions = {
        sorting,
        currentPage,
        pageSize,
        filters,
        grouping,
        expandedGroups: Array.from(expandedGroups.values())
      };

      loadingPromise = fetchData(loadOptions).then(res => {
        if (res.dataFetched) {
          previousResult = res.data;
          return res.data.rows;
        } else {
          previousResult = undefined;
          return [];
        }
      });

      return loadingPromise;
    },

    getTotalCount() {
      return loadingPromise
        ? loadingPromise.then(() => {
            return previousResult ? previousResult.totalCount : 0;
          })
        : 0;
    }
  };
}

const { getRows, getTotalCount } = dataContext();

export default class DevExtremeDataServer extends React.PureComponent {
  render() {
    return (
      <PluginContainer>
        <Getter
          name="rows"
          pureComputed={getRows}
          connectArgs={getter => {
            return [
              'sorting',
              'currentPage',
              'pageSize',
              'filters',
              'grouping',
              'expandedGroups'
            ].map(getter);
          }}
        />
        <Getter name="totalCount" pureComputed={getTotalCount} />
      </PluginContainer>
    );
  }
}
