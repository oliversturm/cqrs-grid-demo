const GRID_STATE_CHANGE = 'GRID_STATE_CHANGE';
const GRID_EDITING_STATE_CHANGE = 'GRID_EDITING_STATE_CHANGE';
const GRID_RESET_EDITING_STATE = 'GRID_RESET_EDITING_STATE';
const GRID_RELOAD = 'GRID_RELOAD';

const gridStateChange = (stateFieldName, stateFieldValue) => ({
  type: GRID_STATE_CHANGE,
  stateFieldName,
  stateFieldValue
});

const gridEditingStateChange = (stateFieldName, stateFieldValue) => ({
  type: GRID_EDITING_STATE_CHANGE,
  stateFieldName,
  stateFieldValue
});

const gridResetEditingState = () => ({
  type: GRID_RESET_EDITING_STATE
});

const gridReload = () => ({
  type: GRID_RELOAD
});

const createGridReducer = initialState => (state, action) => {
  if (!state) return initialState;

  switch (action.type) {
    case GRID_STATE_CHANGE:
      return {
        ...state,
        [action.stateFieldName]: action.stateFieldValue
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
    case GRID_RELOAD:
      return {
        ...state,
        reloadState: new Date().getTime()
      };

    default:
      return state;
  }
};

export {
  gridStateChange,
  gridEditingStateChange,
  gridResetEditingState,
  gridReload,
  createGridReducer,
  GRID_STATE_CHANGE,
  GRID_EDITING_STATE_CHANGE,
  GRID_RESET_EDITING_STATE,
  GRID_RELOAD
};
