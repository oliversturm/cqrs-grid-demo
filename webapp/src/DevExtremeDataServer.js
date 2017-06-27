import React from 'react';

import { Getter, Watcher, PluginContainer } from '@devexpress/dx-react-core';

import { createDataFetcher } from './data-access';

export default class DevExtremeDataServer extends React.PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      loadResult: undefined
    };
    this.getRows = this.getRows.bind(this);
    this.getTotalCount = this.getTotalCount.bind(this);

    this.fetchData = createDataFetcher();
  }

  getRows() {
    console.log(
      `Returning rows, loadResult ${this.state.loadResult ? 'exists' : "doesn't exist"}`
    );

    return this.state.loadResult ? this.state.loadResult.rows : [];
  }

  getTotalCount() {
    console.log(
      `Returning totalCount, loadResult ${this.state.loadResult ? 'exists' : "doesn't exist"}`
    );

    return this.state.loadResult ? this.state.loadResult.totalCount : 0;
  }

  getData(sorting, currentPage, pageSize, filters, grouping, expandedGroups) {
    const loadOptions = {
      sorting,
      currentPage,
      pageSize,
      filters,
      grouping,
      expandedGroups: expandedGroups
        ? Array.from(expandedGroups.values())
        : undefined
    };

    this.fetchData(loadOptions).then(res => {
      if (res.dataFetched) {
        this.setState({
          loadResult: {
            rows: res.data.rows,
            totalCount: res.data.totalCount
          }
        });
      }
    });
  }

  render() {
    console.log('rendering data server plugin');

    return (
      <PluginContainer>
        <Watcher
          watch={getter =>
            [
              'sorting',
              'currentPage',
              'pageSize',
              'filters',
              'grouping',
              'expandedGroups'
            ].map(getter)}
          onChange={(action, ...vals) => {
            console.log('watch triggered');

            this.getData.apply(this, vals);
          }}
        />
        <Getter name="totalCount" value={this.getTotalCount()} />
        <Getter name="rows" value={this.getRows()} />
        {
          // the following getter is currently required, otherwise
          // the paging mechanism gets confused
        }
        <Getter
          name="totalPages"
          pureComputed={(totalCount, pageSize) =>
            pageSize ? Math.max(1, Math.ceil(totalCount / pageSize)) : 1}
          connectArgs={getter => [getter('totalCount'), getter('pageSize')]}
        />
      </PluginContainer>
    );
  }
}
