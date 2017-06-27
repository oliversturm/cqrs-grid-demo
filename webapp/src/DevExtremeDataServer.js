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

  getData(
    sorting,
    currentPage,
    pageSize,
    filters,
    grouping,
    expandedGroups,
    reloadState
  ) {
    const loadOptions = {
      sorting,
      currentPage,
      pageSize,
      filters,
      grouping,
      expandedGroups: expandedGroups
        ? Array.from(expandedGroups.values())
        : undefined,
      force: reloadState !== this.state.reloadState
    };
    this.setState({
      reloadState
    });

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
    return (
      <PluginContainer>
        <Getter name="reloadState" value={this.props.reloadState || 0} />
        <Watcher
          watch={getter =>
            [
              'sorting',
              'currentPage',
              'pageSize',
              'filters',
              'grouping',
              'expandedGroups',
              'reloadState'
            ].map(getter)}
          onChange={(action, ...vals) => this.getData.apply(this, vals)}
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
