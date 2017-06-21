const GRID_STATE_CHANGE = 'GRID_STATE_CHANGE';
const GRID_DATA_LOADED = 'GRID_DATA_LOADED';
const GRID_PAGE_SIZE_CHANGE = 'GRID_PAGE_SIZE_CHANGE';
const GRID_EDITING_STATE_CHANGE = 'GRID_EDITING_STATE_CHANGE';
const GRID_LOAD = 'GRID_LOAD';
const GRID_RESET_EDITING_STATE = 'GRID_RESET_EDITING_STATE';

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

const createGridReducer = initialState => (state, action) => {
  if (!state)
    return {
      grid: initialState
    };
  else if (!state.grid)
    return {
      ...state,
      grid: initialState
    };

  switch (action.type) {
    case GRID_STATE_CHANGE:
      return {
        ...state,
        grid: {
          ...state.grid,
          loading: true,
          [action.stateFieldName]: action.stateFieldValue
        }
      };
    case GRID_DATA_LOADED:
      return {
        ...state,
        grid: {
          ...state.grid,
          rows: action.data.rows,
          totalCount: action.data.totalCount,
          loading: false
        }
      };
    case GRID_PAGE_SIZE_CHANGE:
      const newPage = Math.trunc(
        state.currentPage * state.pageSize / action.pageSize
      );
      return {
        ...state,
        grid: {
          ...state.grid,
          currentPage: newPage,
          pageSize: action.pageSize,
          loading: true
        }
      };
    case GRID_EDITING_STATE_CHANGE:
      const { editingRows, changedRows, addedRows } = state.grid;
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
        grid: {
          ...state.grid,
          loading: true,
          hasEditingChanges,
          [action.stateFieldName]: action.stateFieldValue
        }
      };
    case GRID_RESET_EDITING_STATE:
      return {
        ...state,
        grid: {
          ...state.grid,
          editingRows: [],
          addedRows: [],
          changedRows: {},
          hasEditingChanges: false
        }
      };

    default:
      return state;
  }
};

export {
  gridStateChange,
  gridDataLoaded,
  gridPageSizeChange,
  gridEditingStateChange,
  gridResetEditingState,
  gridLoad,
  createGridReducer,
  GRID_STATE_CHANGE,
  GRID_DATA_LOADED,
  GRID_PAGE_SIZE_CHANGE,
  GRID_EDITING_STATE_CHANGE,
  GRID_RESET_EDITING_STATE,
  GRID_LOAD
};
