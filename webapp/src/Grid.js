import React from 'react';
import { Grid, PagingState, SortingState } from '@devexpress/dx-react-grid';
import {
  TableView,
  TableHeaderRow,
  PagingPanel
} from '@devexpress/dx-react-grid-bootstrap3';

import { connect } from 'react-redux';

import {
  gridStateChange,
  gridDataLoaded,
  gridPageSizeChange,
  createGridReducer
} from './grid-reducer';
import { createQueryURL, convertResponseData } from './data-access';

class ReduxGrid extends React.PureComponent {
  render() {
    const {
      rows,
      columns,
      sorting,
      onSortingChange,
      currentPage,
      pageSize,
      onPageSizeChange,
      totalCount,
      allowedPageSizes,
      onCurrentPageChange
    } = this.props;
    return (
      <Grid rows={rows} columns={columns}>
        <PagingState
          pageSize={pageSize}
          onPageSizeChange={onPageSizeChange}
          currentPage={currentPage}
          onCurrentPageChange={onCurrentPageChange}
          totalCount={totalCount}
        />
        <SortingState sorting={sorting} onSortingChange={onSortingChange} />
        <TableView />
        <TableHeaderRow allowSorting />
        <PagingPanel allowedPageSizes={allowedPageSizes} />
      </Grid>
    );
  }

  componentDidMount() {
    this.loadData();
  }
  componentDidUpdate() {
    this.loadData();
  }

  loadData() {
    const loadOptions = {
      sorting: this.props.sorting,
      currentPage: this.props.currentPage,
      pageSize: this.props.pageSize
    };

    const queryURL = createQueryURL(
      '//localhost:3000/data/v1/values',
      loadOptions
    );

    if (!(queryURL === this.lastQueryURL)) {
      fetch(queryURL)
        .then(response => response.json())
        .then(data =>
          this.props.dispatch(gridDataLoaded(convertResponseData(data)))
        )
        .catch(() => this.props.dispatch(gridStateChange('loading', false)));

      this.lastQueryURL = queryURL;
    } else this.props.dispatch(gridStateChange('loading', false));
  }
}

const mapStateToProps = state => state;

const mapDispatchToProps = dispatch => ({
  onSortingChange: sorting => {
    dispatch(gridStateChange('sorting', sorting));
  },
  onCurrentPageChange: currentPage => {
    dispatch(gridStateChange('currentPage', currentPage));
  },
  onPageSizeChange: pageSize => {
    dispatch(gridPageSizeChange(pageSize));
  },
  dispatch
});

const connectedGrid = connect(mapStateToProps, mapDispatchToProps)(ReduxGrid);

const gridReducer = createGridReducer({
  columns: [
    {
      name: 'date1',
      title: 'date1'
    },
    {
      name: 'date2',
      title: 'date2'
    },
    {
      name: 'int1',
      title: 'int1'
    },
    {
      name: 'int2',
      title: 'int2'
    },
    {
      name: 'string',
      title: 'string'
    }
  ],
  rows: [],
  sorting: [],
  currentPage: 0,
  totalCount: 0,
  pageSize: 10,
  allowedPageSizes: [5, 10, 20, 50],
  loading: false
});

export { connectedGrid as Grid, gridReducer };
