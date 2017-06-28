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
