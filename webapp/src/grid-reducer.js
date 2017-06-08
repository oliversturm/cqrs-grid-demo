const GRID_STATE_CHANGE = 'GRID_STATE_CHANGE';

const gridStateChange = (stateFieldName, stateFieldValue) => ({
  type: GRID_STATE_CHANGE,
  stateFieldName,
  stateFieldValue
});

const createGridReducer = initialState => (state = initialState, action) => {
  if (action.type === GRID_STATE_CHANGE) {
    return {
      ...state,
      [action.stateFieldName]: action.stateFieldValue
    };
  } else return state;
};

export { gridStateChange, createGridReducer };
