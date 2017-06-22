import uuid from 'uuid/v4';

import React from 'react';
import {
  PagingState,
  SortingState,
  FilteringState,
  GroupingState,
  EditingState
} from '@devexpress/dx-react-grid';
import {
  Grid,
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
  gridPageSizeChange,
  gridEditingStateChange,
  gridLoad,
  createGridReducer
} from './grid-reducer';

import DateTimePicker from 'react-datetime';
import NumericInput from 'react-numeric-input';

import Loading from './loading';

const DateEditor = ({ value, onValueChange }) => (
  <td>
    <DateTimePicker
      closeOnSelect={true}
      utc={true}
      value={Date.parse(value)}
      onChange={moment => onValueChange(moment ? moment.toDate() : null)}
    />
  </td>
);

const IntEditor = ({ value, onValueChange }) => (
  <td>
    <NumericInput
      className="form-control"
      value={value}
      onChange={valueAsNumber => onValueChange(valueAsNumber)}
    />
  </td>
);

class ReduxGrid extends React.PureComponent {
  constructor(props) {
    super(props);
    this.editCellTemplate = this.editCellTemplate.bind(this);
    this.filterCellTemplate = this.filterCellTemplate.bind(this);
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
      onAddedRowsChange,
      loading
    } = this.props;
    return (
      <div style={{ position: 'relative' }}>
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
          <TableHeaderRow allowSorting allowGrouping />
          <TableFilterRow filterCellTemplate={this.filterCellTemplate} />
          <TableGroupRow />
          <PagingPanel allowedPageSizes={allowedPageSizes} />
          <GroupingPanel allowSorting />
          <TableEditRow editCellTemplate={this.editCellTemplate} />
          <TableEditColumn
            allowAdding
            allowEditing
            commandTemplate={({ id }) => (id === 'commit' ? null : undefined)}
          />
        </Grid>
        {loading && <Loading />}
      </div>
    );
  }

  componentDidMount() {
    this.props.dispatch(gridLoad());
  }

  componentDidUpdate() {
    this.props.dispatch(gridLoad());
  }

  getRowId(row) {
    return row._id || uuid();
  }

  // I get complaints if I don't bind onCommitChanges on EditingState
  // Guess this should be optional
  onCommitChanges() {}

  editCellTemplate({ column, value, onValueChange }) {
    switch (column.name) {
      case 'date1':
      case 'date2':
        return <DateEditor value={value} onValueChange={onValueChange} />;

      case 'int1':
      case 'int2':
        return <IntEditor value={value} onValueChange={onValueChange} />;

      default:
        return undefined;
    }
  }

  filterCellTemplate({ column, filter, setFilter }) {
    switch (column.name) {
      case 'date1':
      case 'date2':
        return (
          <DateEditor
            value={filter ? filter.value : null}
            onValueChange={filterDate =>
              setFilter({
                value: filterDate
              })}
          />
        );

      case 'int1':
      case 'int2':
        return (
          <IntEditor
            value={filter ? filter.value : null}
            onValueChange={filterNumber =>
              setFilter({
                value: filterNumber
              })}
          />
        );

      default:
        return undefined;
    }
  }
}

const mapStateToProps = state => state.grid;

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
    dispatch(gridEditingStateChange('editingRows', editingRows)),
  onAddedRowsChange: addedRows =>
    dispatch(gridEditingStateChange('addedRows', addedRows)),
  onChangedRowsChange: changedRows =>
    dispatch(gridEditingStateChange('changedRows', changedRows)),
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
