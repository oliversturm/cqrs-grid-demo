import uuid from 'uuid/v4';

import React from 'react';
import {
  Grid,
  PagingState,
  SortingState,
  FilteringState,
  GroupingState,
  EditingState
} from '@devexpress/dx-react-grid';
import {
  TableView,
  TableHeaderRow,
  PagingPanel,
  GroupingPanel,
  TableFilterRow,
  TableGroupRow,
  TableEditRow,
  TableEditColumn
} from '@devexpress/dx-react-grid-bootstrap3';

import { connect } from 'react-redux';

import {
  gridStateChange,
  gridDataLoaded,
  gridPageSizeChange,
  createGridReducer
} from './grid-reducer';
import { fetchData, commitChanges } from './data-access';

class ReduxGrid extends React.PureComponent {
  constructor(props) {
    super(props);
    this.onCommitChanges = this.onCommitChanges.bind(this);
  }

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
      onCurrentPageChange,
      filters,
      onFiltersChange,
      grouping,
      onGroupingChange,
      expandedGroups,
      onExpandedGroupsChange,
      editingRows,
      onEditingRowsChange,
      changedRows,
      onChangedRowsChange,
      addedRows,
      onAddedRowsChange
    } = this.props;
    return (
      <Grid rows={rows} columns={columns} getRowId={this.getRowId}>
        <FilteringState filters={filters} onFiltersChange={onFiltersChange} />
        <PagingState
          pageSize={pageSize}
          onPageSizeChange={onPageSizeChange}
          currentPage={currentPage}
          onCurrentPageChange={onCurrentPageChange}
          totalCount={totalCount}
        />
        <SortingState sorting={sorting} onSortingChange={onSortingChange} />
        <GroupingState
          grouping={grouping}
          onGroupingChange={onGroupingChange}
          expandedGroups={expandedGroups}
          onExpandedGroupsChange={onExpandedGroupsChange}
        />
        <EditingState
          editingRows={editingRows}
          onEditingRowsChange={onEditingRowsChange}
          changedRows={changedRows}
          onChangedRowsChange={onChangedRowsChange}
          addedRows={addedRows}
          onAddedRowsChange={onAddedRowsChange}
          onCommitChanges={this.onCommitChanges}
        />
        <TableView />
        <TableHeaderRow allowSorting allowGrouping allowDragging />
        <TableFilterRow />
        <TableGroupRow />
        <PagingPanel allowedPageSizes={allowedPageSizes} />
        <GroupingPanel allowSorting />
        <TableEditRow />
        <TableEditColumn allowAdding allowEditing />
      </Grid>
    );
  }

  componentDidMount() {
    this.loadData();
  }
  componentDidUpdate() {
    this.loadData();
  }

  getRowId(row) {
    return row._id || uuid();
  }

  loadData(force = false) {
    const loadOptions = {
      sorting: this.props.sorting,
      currentPage: this.props.currentPage,
      pageSize: this.props.pageSize,
      filters: this.props.filters,
      grouping: this.props.grouping,
      expandedGroups: this.props.expandedGroups
    };
    if (force) loadOptions.force = true;

    fetchData(loadOptions).then(res => {
      if (res.dataFetched) {
        this.props.dispatch(gridDataLoaded(res.data));
      } else this.props.dispatch(gridStateChange('loading', false));
    });
  }

  onCommitChanges(changes) {
    commitChanges(changes);
    // Without the delay, the grid reacts so quickly that we won't
    // see the change coming back from the service. Delaying may
    // not be the most elegant option in reality, but then this
    // part of the demo doesn't have change notifications.
    setTimeout(() => this.loadData(true), 100);
  }
}

const mapStateToProps = state => state;

const mapDispatchToProps = dispatch => ({
  onSortingChange: sorting => dispatch(gridStateChange('sorting', sorting)),
  onCurrentPageChange: currentPage =>
    dispatch(gridStateChange('currentPage', currentPage)),
  onPageSizeChange: pageSize => dispatch(gridPageSizeChange(pageSize)),
  onFiltersChange: filters => dispatch(gridStateChange('filters', filters)),
  onGroupingChange: grouping => dispatch(gridStateChange('grouping', grouping)),
  onExpandedGroupsChange: expandedGroups =>
    dispatch(gridStateChange('expandedGroups', expandedGroups)),
  onEditingRowsChange: editingRows =>
    dispatch(gridStateChange('editingRows', editingRows)),
  onAddedRowsChange: addedRows =>
    dispatch(gridStateChange('addedRows', addedRows)),
  onChangedRowsChange: changedRows =>
    dispatch(gridStateChange('changedRows', changedRows)),
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
  filters: [],
  grouping: [],
  expandedGroups: [],
  editingRows: [],
  addedRows: [],
  changedRows: {},
  loading: false
});

export { connectedGrid as Grid, gridReducer };
