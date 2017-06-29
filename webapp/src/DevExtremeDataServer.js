import React from 'react';
import PropTypes from 'prop-types';

import {
  Getter,
  Watcher,
  Template,
  TemplatePlaceholder,
  PluginContainer
} from '@devexpress/dx-react-core';

import './loading.css';

import { createDataFetcher } from './data-access';

// This works with Bootstrap, and it seems a harmless default since
// it only uses styles.
const defaultLoadingIndicator = () => (
  <div className="loading-shading">
    <span className="glyphicon glyphicon-refresh loading-icon" />
  </div>
);

class DevExtremeDataServer extends React.PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      loadResult: undefined,
      reloadState: undefined,
      loading: false
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
          loading: false,
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
      expandedGroups: this.state.expandedGroups,
      force: this.props.reloadState !== this.state.reloadState
    };
  }

  componentDidUpdate(prevProps, prevState) {
    // We get here both through state updates triggered by the watcher
    // and through prop updates (reloadState). In the latter case,
    // we need to make sure the loading flag is set.
    if (this.props.reloadState !== prevProps.reloadState && !this.state.loading)
      this.setState({
        loading: true
      });
    else this.getData(this.getLoadOptions());
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
          onChange={(action, ...vals) => {
            const newPage = this.state.pageSize >= 0 &&
              this.state.pageSize !== vals[2]
              ? Math.trunc(vals[1] * this.state.pageSize / vals[2])
              : vals[1];

            this.setState({
              sorting: vals[0],
              currentPage: newPage,
              pageSize: vals[2],
              filters: vals[3],
              grouping: vals[4],
              expandedGroups: vals[5] ? Array.from(vals[5].values()) : [],
              loading: true
            });
            if (newPage !== vals[1]) {
              action('setCurrentPage')({
                page: newPage
              });
            }
          }}
        />
        <Getter name="totalCount" value={this.getTotalCount()} />
        <Getter name="rows" value={this.getRows()} />
        <Getter name="loading" value={this.state.loading} />
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
        <Template name="root">
          <div>
            <TemplatePlaceholder />
            {this.state.loading &&
              this.props.useLoadingIndicator &&
              this.props.loadingIndicator()}
          </div>
        </Template>
      </PluginContainer>
    );
  }
}

DevExtremeDataServer.defaultProps = {
  url: undefined,
  reloadState: 0,
  loadingIndicator: defaultLoadingIndicator,
  useLoadingIndicator: true
};

DevExtremeDataServer.propTypes = {
  url: PropTypes.string,
  reloadState: PropTypes.number,
  loadingIndicator: PropTypes.func,
  useLoadingIndicator: PropTypes.bool
};

export default DevExtremeDataServer;
