import React from 'react';
import PropTypes from 'prop-types';

import {
  Getter,
  Template,
  TemplatePlaceholder,
  PluginContainer
} from '@devexpress/dx-react-core';

import { CustomGrouping } from '@devexpress/dx-react-grid';

import _ from 'lodash';

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
    if (currentRows.length === 0 || currentRows[0].type !== 'groupRow') {
      // In spite of the efforts with the temp bindings to CustomGrouping.grouping
      // and CustomGrouping.expandedGroups, I still receive a call to this function
      // right after grouping is first established, where the rows passed are
      // the wrong (i.e. non-grouping) format and can't be processed. I can
      // ignore this easily enough, but it is unclear to me why this happens
      // or whether there isn't a way to prevent it.
      //
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
        <Getter
          name="rows"
          computed={(
            {
              sorting,
              currentPage,
              pageSize,
              filters,
              grouping,
              expandedGroups
            },
            actions
          ) => {
            // For initialization, state.pageSize will be undefined.
            // Just use the new value then.
            const oldPageSize = this.state.pageSize || pageSize;

            const newPage = (() => {
              if (oldPageSize !== pageSize)
                // pageSize has changed. Calculate new currentPage
                // for new pageSize > 0, otherwise currentPage will be 0.
                return pageSize > 0
                  ? Math.trunc(currentPage * oldPageSize / pageSize)
                  : 0;
              else
                // pageSize hasn't changed, use given currentPage
                return currentPage;
            })();

            const newState = {
              sorting,
              currentPage: newPage,
              pageSize,
              filters,
              grouping,
              expandedGroups,
              loading: true
            };

            if (
              !_.isEqual(this.state.grouping, grouping) ||
              !_.isEqual(this.state.expandedGroups, expandedGroups)
            ) {
              newState.tempGrouping = this.state.grouping;
              newState.tempExpandedGroups = this.state.expandedGroups
                ? Array.from(this.state.expandedGroups.values())
                : [];
            }

            this.setState(newState);

            if (newPage !== currentPage) actions.setCurrentPage(newPage);

            return [];
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
          computed={({ pageSize, totalCount }) =>
            pageSize > 0
              ? Math.ceil(totalCount / pageSize)
              : totalCount > 0 ? 1 : 0}
        />
        {
          // make sure that when totalPages changes, currentPage remains
          // in range
          // If totalPages is 0, we don't do anything - this is
          // assuming that there is no data *yet* and we don't want
          // to lose the previous currentPage state.
        }
        <Getter
          name="currentPage"
          computed={({ currentPage, totalPages }, actions) => {
            if (totalPages > 0 && totalPages - 1 < currentPage)
              actions.setCurrentPage(Math.max(totalPages - 1, 0));
            return currentPage;
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
