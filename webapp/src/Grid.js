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
import {
  createQueryURL,
  convertResponseData,
  commitChanges
} from './data-access';

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
          onCommitChanges={commitChanges}
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
    if (!row._id) console.error('Found row with no id: ', row);
    if (row.type && row.type === 'groupRow') return row.key;

    return row._id;
  }

  loadData() {
    const loadOptions = {
      sorting: this.props.sorting,
      currentPage: this.props.currentPage,
      pageSize: this.props.pageSize,
      filters: this.props.filters,
      grouping: this.props.grouping
    };

    const queryURL = createQueryURL(
      '//localhost:3000/data/v1/values',
      loadOptions
    );

    if (!(queryURL === this.lastQueryURL)) {
      console.log('Querying (decoded): ', decodeURIComponent(queryURL));

      fetch(queryURL)
        .then(response => response.json())
        .then(data =>
          this.props.dispatch(
            gridDataLoaded(convertResponseData(data, loadOptions))
          )
        )
        .catch(() => this.props.dispatch(gridStateChange('loading', false)));

      this.lastQueryURL = queryURL;
    } else this.props.dispatch(gridStateChange('loading', false));
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
