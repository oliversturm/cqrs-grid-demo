const GRID_STATE_CHANGE = 'GRID_STATE_CHANGE';
const GRID_DATA_LOADED = 'GRID_DATA_LOADED';
const GRID_PAGE_SIZE_CHANGE = 'GRID_PAGE_SIZE_CHANGE';

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

const createGridReducer = initialState => (state = initialState, action) => {
  switch (action.type) {
    case GRID_STATE_CHANGE:
      return {
        ...state,
        loading: true,
        [action.stateFieldName]: action.stateFieldValue
      };
    case GRID_DATA_LOADED:
      return {
        ...state,
        rows: action.data.rows,
        totalCount: action.data.totalCount,
        loading: false
      };
    case GRID_PAGE_SIZE_CHANGE:
      const newPage = Math.trunc(
        state.currentPage * state.pageSize / action.pageSize
      );
      return {
        ...state,
        currentPage: newPage,
        pageSize: action.pageSize,
        loading: true
      };
    default:
      return state;
  }
};

export {
  gridStateChange,
  gridDataLoaded,
  gridPageSizeChange,
  createGridReducer
};