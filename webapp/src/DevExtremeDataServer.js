import React from 'react';
import PropTypes from 'prop-types';

import { Getter, Watcher, PluginContainer } from '@devexpress/dx-react-core';

import { createDataFetcher } from './data-access';

class DevExtremeDataServer extends React.PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      loadResult: undefined,
      reloadState: undefined
    };
    this.getRows = this.getRows.bind(this);
    this.getTotalCount = this.getTotalCount.bind(this);

    this.fetchData = createDataFetcher(this.props.url);
  }

  getRows() {
    return this.state.loadResult ? this.state.loadResult.rows : [];
  }

  getTotalCount() {
    return this.state.loadResult ? this.state.loadResult.totalCount : 0;
  }

  getData(loadOptions) {
    this.fetchData(loadOptions).then(res => {
      if (res.dataFetched) {
        this.setState({
          reloadState: this.props.reloadState,
          loadResult: {
            rows: res.data.rows,
            totalCount: res.data.totalCount
          }
        });
      }
    });
  }

  getLoadOptions() {
    return {
      sorting: this.state.sorting,
      currentPage: this.state.currentPage,
      pageSize: this.state.pageSize,
      filters: this.state.filters,
      grouping: this.state.grouping,
      expandedGroups: this.state.expandedGroups
        ? Array.from(this.state.expandedGroups.values())
        : undefined,
      force: this.props.reloadState !== this.state.reloadState
    };
  }

  componentDidUpdate() {
    this.getData(this.getLoadOptions());
  }

  render() {
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
          onChange={(action, ...vals) =>
            this.setState({
              sorting: vals[0],
              currentPage: vals[1],
              pageSize: vals[2],
              filters: vals[3],
              grouping: vals[4],
              expandedGroups: vals[5]
            })}
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
        {
          // just leaving this in as a reminder - where would the old
          // pageSize come from?
          // <Watcher
          //   watch={getter => [getter('pageSize'), getter('currentPage')]}
          //   onChange={(action, pageSize, currentPage) => {
          //     const newPage = Math.trunc(currentPage * oldPageSize / pageSize);
          //     console.log(
          //       `Change with pageSize=${pageSize}, currentPage=${currentPage}, setting ${newPage}`
          //     );
          //     action('setCurrentPage')({
          //       page: newPage
          //     });
          //   }}
          // />
        } {
          // make sure that when totalPages changes, currentPage remains
          // in range
        }
        <Watcher
          watch={getter => [getter('totalPages'), getter('currentPage')]}
          onChange={(action, totalPages, currentPage) => {
            if (totalPages - 1 < currentPage) {
              action('setCurrentPage')({ page: Math.max(totalPages - 1, 0) });
            }
          }}
        />
      </PluginContainer>
    );
  }
}

DevExtremeDataServer.defaultProps = {
  url: undefined,
  reloadState: 0
};

DevExtremeDataServer.propTypes = {
  url: PropTypes.string,
  reloadState: PropTypes.number
};

export default DevExtremeDataServer;
