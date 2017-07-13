import uuid from 'uuid/v4';

import React from 'react';
import {
  PagingState,
  SortingState,
  FilteringState,
  GroupingState,
  EditingState
} from '@devexpress/dx-react-grid';

import { connect } from 'react-redux';

import {
  gridStateChange,
  gridPageSizeChange,
  gridFiltersChange,
  gridEditingStateChange,
  gridLoad,
  createGridReducer
} from './grid-reducer';

import DateTimePicker from 'react-datetime';
import NumericInput from 'react-numeric-input';

import {
  // not ported yet in material-ui alpha
  //DatePicker as MuiDatePicker,
  TextField as MuiTextField,
  TableCell as MuiTableCell
} from 'material-ui';

import { BsLoading, MuiLoading } from './loading';

function requireGrid(ui) {
  return {
    material: () => require('@devexpress/dx-react-grid-material-ui'),
    bootstrap: () => require('@devexpress/dx-react-grid-bootstrap3')
  }[ui]();
}

// These (BS) editors don't render perfectly yet when used in the filter
// row, because I'd have to wrap them in <th> instead of <td>. I'm not
// doing this now - a final mechanism for custom editors should not
// require me to deal with those details.
const BsDateEditor = ({ value, onValueChange }) => (
  <td>
    <DateTimePicker
      closeOnSelect={true}
      utc={true}
      value={Date.parse(value)}
      onChange={moment => onValueChange(moment ? moment.toDate() : null)}
    />
  </td>
);

const BsIntEditor = ({ value, onValueChange }) => (
  <td>
    <NumericInput
      className="form-control"
      value={value}
      onChange={valueAsNumber => onValueChange(valueAsNumber)}
    />
  </td>
);

// not ported yet
// const MuiDateEditor = ({ value, onValueChange }) => (
//   <td>
//     <MuiDatePicker
//       autoOk={true}
//       value={Date.parse(value)}
//       onChange={(e, date) => onValueChange(date)}
//     />
//   </td>
// );

// This editor doesn't work quite right yet. The standard grid cells
// use a container called EditCell, which carries extra css classes.
// There doesn't appear to be a way at this point to reuse that behavior
// for custom editors.
// For the filter row, using the MUI TableCell at least takes care
// of using <th> instead of <td>.
const MuiIntEditor = ({ value, onValueChange }) => (
  <MuiTableCell>
    <MuiTextField
      type="number"
      value={value}
      onChange={(e, newValue) => onValueChange(newValue)}
    />
  </MuiTableCell>
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
      showLoadingIndicator,
      activeUI,
      useCustomEditors
    } = this.props;
    // loading the ui specific elements depending on current UI
    const {
      Grid,
      TableView,
      TableHeaderRow,
      PagingPanel,
      GroupingPanel,
      TableFilterRow,
      TableGroupRow,
      TableEditRow,
      TableEditColumn
    } = requireGrid(activeUI);

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
          <TableFilterRow
            filterCellTemplate={e =>
              this.filterCellTemplate(useCustomEditors, activeUI, e)}
          />
          <TableGroupRow />
          <PagingPanel allowedPageSizes={allowedPageSizes} />
          <GroupingPanel allowSorting />
          <TableEditRow
            editCellTemplate={e =>
              this.editCellTemplate(useCustomEditors, activeUI, e)}
          />
          <TableEditColumn
            allowAdding
            allowEditing
            commandTemplate={({ id }) => (id === 'commit' ? null : undefined)}
          />
        </Grid>
        {showLoadingIndicator && this.loadingIndicator(activeUI)}
      </div>
    );
  }

  componentDidMount() {
    this.props.dispatch(gridLoad());
  }

  getRowId(row) {
    return row._id || uuid();
  }

  // I get complaints if I don't bind onCommitChanges on EditingState
  // Guess this should be optional
  onCommitChanges() {}

  loadingIndicator(activeUI) {
    if (activeUI === 'material') return <MuiLoading />;
    else if (activeUI === 'bootstrap') return <BsLoading />;
    else return null;
  }

  editCellTemplate(
    useCustomEditors,
    activeUI,
    { column, value, onValueChange }
  ) {
    if (!useCustomEditors) return undefined;

    switch (column.name) {
      case 'date1':
      case 'date2':
        if (activeUI === 'bootstrap')
          return <BsDateEditor value={value} onValueChange={onValueChange} />;
        else if (activeUI === 'material')
          return undefined; // date picker not ported yet
        else return undefined;

      case 'int1':
      case 'int2':
        if (activeUI === 'bootstrap')
          return <BsIntEditor value={value} onValueChange={onValueChange} />;
        else if (activeUI === 'material')
          return <MuiIntEditor value={value} onValueChange={onValueChange} />;
        else return undefined;

      default:
        return undefined;
    }
  }

  filterCellTemplate(
    useCustomEditors,
    activeUI,
    { column, filter, setFilter }
  ) {
    if (!useCustomEditors) return undefined;

    const editorProps = {
      value: filter ? filter.value : null,
      onValueChange(newValue) {
        if (newValue !== editorProps.value)
          setFilter(
            newValue
              ? {
                  value: newValue
                }
              : null
          );
      }
    };

    switch (column.name) {
      case 'date1':
      case 'date2':
        if (activeUI === 'bootstrap') return <BsDateEditor {...editorProps} />;
        else if (activeUI === 'material') return undefined;
        else return undefined; // date picker not ported yet

      case 'int1':
      case 'int2':
        if (activeUI === 'bootstrap') return <BsIntEditor {...editorProps} />;
        else if (activeUI === 'material')
          return <MuiIntEditor {...editorProps} />;
        else return undefined;

      default:
        return undefined;
    }
  }
}

const mapStateToProps = state => ({
  ...state.grid,
  activeUI: state.toolbar.activeUI,
  useCustomEditors: state.toolbar.useCustomEditors
});

const mapDispatchToProps = dispatch => ({
  onSortingChange: sorting => dispatch(gridStateChange('sorting', sorting)),
  onCurrentPageChange: currentPage =>
    dispatch(gridStateChange('currentPage', currentPage)),
  onPageSizeChange: pageSize => dispatch(gridPageSizeChange(pageSize)),
  onFiltersChange: filters => dispatch(gridFiltersChange(filters)),
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
  loading: false,
  showLoadingIndicator: false,
  loadingIndicatorThreshold: 500
});

export { connectedGrid as Grid, gridReducer };
