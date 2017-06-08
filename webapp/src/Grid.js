import React from 'react';
import { Grid, PagingState, SortingState } from '@devexpress/dx-react-grid';
import {
  TableView,
  TableHeaderRow,
  PagingPanel
} from '@devexpress/dx-react-grid-bootstrap3';

import { connect } from 'react-redux';

import { gridStateChange, createGridReducer } from './grid-reducer';

class ReduxGrid extends React.PureComponent {
  render() {
    const {
      rows,
      columns,
      sorting,
      onSortingChange,
      currentPage,
      onCurrentPageChange
    } = this.props;
    return (
      <Grid rows={rows} columns={columns}>
        <PagingState
          pageSize={10}
          currentPage={currentPage}
          onCurrentPageChange={onCurrentPageChange}
        />
        <SortingState sorting={sorting} onSortingChange={onSortingChange} />
        <TableView />
        <TableHeaderRow allowSorting />
        <PagingPanel />
      </Grid>
    );
  }

  componentDidMount() {
    this.loadData();
  }
  componentDidUpdate() {
    this.loadData();
  }

  loadData() {}
}

const mapStateToProps = state => state;

const mapDispatchToProps = dispatch => ({
  onSortingChange: sorting => dispatch(gridStateChange('sorting', sorting)),
  onCurrentPageChange: currentPage =>
    dispatch(gridStateChange('currentPage', currentPage))
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
  rows: [
    {
      string: 'Oliver',
      int1: 32
    },
    {
      string: 'Steve',
      int1: 47
    }
  ],
  sorting: [],
  currentPage: 0
});

export { connectedGrid as Grid, gridReducer };
