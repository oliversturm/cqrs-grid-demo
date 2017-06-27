const GRID_STATE_CHANGE = 'GRID_STATE_CHANGE';
const GRID_PAGE_SIZE_CHANGE = 'GRID_PAGE_SIZE_CHANGE';
const GRID_EDITING_STATE_CHANGE = 'GRID_EDITING_STATE_CHANGE';
const GRID_RESET_EDITING_STATE = 'GRID_RESET_EDITING_STATE';

const gridStateChange = (stateFieldName, stateFieldValue) => ({
  type: GRID_STATE_CHANGE,
  stateFieldName,
  stateFieldValue
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

const gridResetEditingState = () => ({
  type: GRID_RESET_EDITING_STATE
});

const createGridReducer = initialState => (state, action) => {
  if (!state) return initialState;

  switch (action.type) {
    case GRID_STATE_CHANGE:
      return {
        ...state,
        [action.stateFieldName]: action.stateFieldValue
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
  gridPageSizeChange,
  gridEditingStateChange,
  gridResetEditingState,
  createGridReducer,
  GRID_STATE_CHANGE,
  GRID_PAGE_SIZE_CHANGE,
  GRID_EDITING_STATE_CHANGE,
  GRID_RESET_EDITING_STATE
};
