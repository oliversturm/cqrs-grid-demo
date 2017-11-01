const GRID_STATE_CHANGE = 'GRID_STATE_CHANGE';
const GRID_DATA_LOADED = 'GRID_DATA_LOADED';
const GRID_PAGE_SIZE_CHANGE = 'GRID_PAGE_SIZE_CHANGE';
const GRID_FILTERS_CHANGE = 'GRID_FILTERS_CHANGE';
const GRID_EDITING_STATE_CHANGE = 'GRID_EDITING_STATE_CHANGE';
const GRID_LOAD = 'GRID_LOAD';
const GRID_RESET_EDITING_STATE = 'GRID_RESET_EDITING_STATE';
const GRID_GROUPING_STATE_CHANGE = 'GRID_GROUPING_STATE_CHANGE';
const GRID_RESET_TEMP_GROUPING = 'GRID_RESET_TEMP_GROUPING';

const gridStateChange = (stateFieldName, stateFieldValue) => ({
  type: GRID_STATE_CHANGE,
  stateFieldName,
  stateFieldValue
});

const gridDataLoaded = data => ({
  type: GRID_DATA_LOADED,
  data
});

const gridPageSizeChange = pageSize => ({
  type: GRID_PAGE_SIZE_CHANGE,
  pageSize
});

const gridFiltersChange = filters => ({
  type: GRID_FILTERS_CHANGE,
  filters
});

const gridEditingStateChange = (stateFieldName, stateFieldValue) => ({
  type: GRID_EDITING_STATE_CHANGE,
  stateFieldName,
  stateFieldValue
});

const gridLoad = force => ({
  type: GRID_LOAD,
  force
});

const gridResetEditingState = () => ({
  type: GRID_RESET_EDITING_STATE
});

const gridGroupingStateChange = (stateFieldName, stateFieldValue) => ({
  type: GRID_GROUPING_STATE_CHANGE,
  stateFieldName,
  stateFieldValue
});

const gridResetTempGrouping = () => ({
  type: GRID_RESET_TEMP_GROUPING
});

const createGridReducer = initialState => (state = initialState, action) => {
  switch (action.type) {
    case GRID_STATE_CHANGE:
      return {
        ...state,
        [action.stateFieldName]: action.stateFieldValue
      };
    case GRID_GROUPING_STATE_CHANGE:
      return {
        ...state,
        [action.stateFieldName]: action.stateFieldValue,
        tempGrouping: state.grouping,
        tempExpandedGroups: state.expandedGroups
      };
    case GRID_DATA_LOADED:
      return {
        ...state,
        rows: action.data.rows,
        totalCount: action.data.totalCount,
        loading: false,
        tempGrouping: null,
        tempExpandedGroups: null
      };
    case GRID_RESET_TEMP_GROUPING:
      return {
        ...state,
        tempGrouping: null,
        tempExpandedGroups: null
      };
    case GRID_PAGE_SIZE_CHANGE:
      const newPage = Math.trunc(
        state.currentPage * state.pageSize / action.pageSize
      );
      return {
        ...state,
        currentPage: newPage,
        pageSize: action.pageSize
      };
    case GRID_FILTERS_CHANGE:
      return {
        ...state,
        currentPage: 0,
        filters: action.filters
      };
    case GRID_EDITING_STATE_CHANGE:
      const { editingRows, changedRows, addedRows } = state;
      const es = {
        editingRows,
        changedRows,
        addedRows
      };
      es[action.stateFieldName] = action.stateFieldValue;

      const hasEditingChanges =
        (es.editingRows && es.editingRows.length > 0) ||
        (es.addedRows && es.addedRows.length > 0) ||
        (es.changedRows && Object.keys(es.changedRows).length > 0);

      return {
        ...state,
        hasEditingChanges,
        [action.stateFieldName]: action.stateFieldValue
      };
    case GRID_RESET_EDITING_STATE:
      return {
        ...state,
        editingRows: [],
        addedRows: [],
        changedRows: {},
        hasEditingChanges: false
      };

    default:
      return state;
  }
};

export {
  gridStateChange,
  gridDataLoaded,
  gridPageSizeChange,
  gridFiltersChange,
  gridEditingStateChange,
  gridResetEditingState,
  gridLoad,
  gridGroupingStateChange,
  gridResetTempGrouping,
  createGridReducer,
  GRID_STATE_CHANGE,
  GRID_DATA_LOADED,
  GRID_PAGE_SIZE_CHANGE,
  GRID_FILTERS_CHANGE,
  GRID_EDITING_STATE_CHANGE,
  GRID_RESET_EDITING_STATE,
  GRID_LOAD,
  GRID_GROUPING_STATE_CHANGE,
  GRID_RESET_TEMP_GROUPING
};
