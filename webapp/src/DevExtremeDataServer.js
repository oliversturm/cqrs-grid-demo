import React from 'react';
import PropTypes from 'prop-types';

import {
  Getter,
  Watcher,
  Template,
  TemplatePlaceholder,
  PluginContainer
} from '@devexpress/dx-react-core';

import { CustomGrouping } from '@devexpress/dx-react-grid';

import _ from 'lodash';

import './loading.css';

import { createDataFetcher } from './data-access';

const diff = require('object-diff');

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
    return this.state.loadResult && this.state.loadResult.rows
      ? this.state.loadResult.rows
      : [];
  }

  getTotalCount() {
    return this.state.loadResult && this.state.loadResult.totalCount
      ? this.state.loadResult.totalCount
      : 0;
  }

  getData(loadOptions) {
    const loadingTimer = setTimeout(() => {
      this.setState({
        showLoadingIndicator: true
      });
    }, this.props.loadingIndicatorThreshold);

    this.fetchData(loadOptions).then(res => {
      if (res.dataFetched) {
        clearTimeout(loadingTimer);

        this.setState({
          reloadState: this.props.reloadState,
          loading: false,
          showLoadingIndicator: false,
          loadResult: {
            rows: res.data.rows,
            totalCount: res.data.totalCount
          },
          tempGrouping: null,
          tempExpandedGroups: null
        });
      }
    });
  }

  getChildGroups(currentRows, grouping) {
    //console.log('getChildGroups with currentRows: ', currentRows);
    // temp exit:
    if (currentRows.length === 0 || currentRows[0].type !== 'groupRow') {
      // console.error(
      //   'getChildGroups: Got data in wrong format, returning without result.'
      // );
      return [];
    }
    return currentRows.reduce((acc, row) => {
      //console.log('Handling row with grouping: ', [row, grouping]);
      if (row.type === 'groupRow' && row.groupedBy === grouping.columnName) {
        acc.push({ key: row.key, value: row.value, childRows: [] });
      } else {
        acc[acc.length - 1].childRows.push(row);
      }
      return acc;
    }, []);
  }

  getLoadOptions() {
    return {
      sorting: this.state.sorting,
      currentPage: this.state.currentPage,
      pageSize: this.state.pageSize,
      filters: this.state.filters,
      grouping: this.state.grouping,
      expandedGroups: this.state.expandedGroups
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

    if (
      prevState.sorting !== this.state.sorting ||
      prevState.currentPage !== this.state.currentPage ||
      prevState.pageSize !== this.state.pageSize ||
      prevState.filters !== this.state.filters ||
      prevState.grouping !== this.state.grouping ||
      prevState.expandedGroups !== this.state.expandedGroups ||
      prevProps.reloadState !== this.props.reloadState
    ) {
      this.getData(this.getLoadOptions());
    } //else console.log('Component updated, but no relevant state changes');
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
            // my current relevant state
            const s = {
              sorting: this.state.sorting,
              currentPage: this.state.currentPage,
              pageSize: this.state.pageSize,
              filters: this.state.filters,
              grouping: this.state.grouping,
              expandedGroups: this.state.expandedGroups
            };

            // the new values - something here should be different from s
            const v = {
              sorting: vals[0],
              currentPage: vals[1],
              pageSize: vals[2],
              filters: vals[3],
              grouping: vals[4],
              expandedGroups: vals[5] //? Array.from(vals[5].values()) : []
            };

            const stateDiff = diff(s, v);

            console.log('Watcher diff: ' + JSON.stringify(stateDiff));

            // For initialization, state.pageSize will be undefined.
            // Just use the new value then.
            const oldPageSize = this.state.pageSize || vals[2];

            const newPage = (() => {
              if (oldPageSize !== vals[2])
                // pageSize has changed. Calculate new currentPage
                // for new pageSize > 0, otherwise currentPage will be 0.
                return vals[2] > 0
                  ? Math.trunc(vals[1] * oldPageSize / vals[2])
                  : 0;
              else
                // pageSize hasn't changed, use given currentPage
                return vals[1];
            })();

            const newState = {
              sorting: vals[0],
              currentPage: newPage,
              pageSize: vals[2],
              filters: vals[3],
              grouping: vals[4],
              expandedGroups: vals[5], // ? Array.from(vals[5].values()) : [],
              loading: true
            };

            // if (!_.isEqual(this.state.expandedGroups, vals[5]))
            //   newState.expandedGroups = vals[5];

            if (stateDiff.grouping) {
              newState.tempGrouping = this.state.grouping;
              newState.tempExpandedGroups = this.state.expandedGroups;
            }

            this.setState(newState);

            if (newPage !== vals[1]) action('setCurrentPage')(newPage);
          }}
        />

        <Getter name="totalCount" value={this.getTotalCount()} />
        <Getter name="rows" value={this.getRows()} />
        <CustomGrouping
          getChildGroups={this.getChildGroups}
          grouping={this.state.tempGrouping}
          expandedGroups={this.state.tempExpandedGroups}
        />
        <Getter name="loading" value={this.state.loading} />
        {
          // The following getter is used to change the logic
          // to return 0 if there are no pages or they can't be
          // calculated - the standard calculation uses 1 as a
          // fallback value.
        }
        <Getter
          name="totalPages"
          computed={getters =>
            getters.pageSize > 0
              ? Math.ceil(getters.totalCount / getters.pageSize)
              : getters.totalCount > 0 ? 1 : 0}
        />
        {
          // make sure that when totalPages changes, currentPage remains
          // in range
        }
        <Watcher
          watch={getter => [getter('totalPages'), getter('currentPage')]}
          onChange={(action, totalPages, currentPage) => {
            // If totalPages is 0, we don't do anything - this is
            // assuming that there is no data *yet* and we don't want
            // to lose the previous currentPage state.
            if (totalPages > 0 && totalPages - 1 < currentPage)
              action('setCurrentPage')(Math.max(totalPages - 1, 0));
          }}
        />
        <Template name="root">
          <div>
            <TemplatePlaceholder />
            {this.state.showLoadingIndicator &&
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
  useLoadingIndicator: true,
  loadingIndicatorThreshold: 500
};

DevExtremeDataServer.propTypes = {
  url: PropTypes.string,
  reloadState: PropTypes.number,
  loadingIndicator: PropTypes.func,
  useLoadingIndicator: PropTypes.bool,
  loadingIndicatorThreshold: PropTypes.number
};

export default DevExtremeDataServer;
