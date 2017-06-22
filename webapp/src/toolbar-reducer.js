const BATCH_SAVE = 'BATCH_SAVE';
const BATCH_DISCARD = 'BATCH_DISCARD';
const CREATE_TEST_DATA = 'CREATE_TEST_DATA';
const ACTIVATE_BOOTSTRAP_UI = 'ACTIVATE_BOOTSTRAP_UI';
const ACTIVATE_MATERIAL_UI = 'ACTIVATE_MATERIAL_UI';

const batchSave = () => ({
  type: BATCH_SAVE
});

const batchDiscard = () => ({
  type: BATCH_DISCARD
});

const createTestData = () => ({
  type: CREATE_TEST_DATA
});

const activateBootstrapUI = () => ({
  type: ACTIVATE_BOOTSTRAP_UI
});

const activateMaterialUI = () => ({
  type: ACTIVATE_MATERIAL_UI
});

const createToolbarReducer = initialState => (state, action) => {
  if (!state) return initialState;

  switch (action.type) {
    case ACTIVATE_BOOTSTRAP_UI:
      return {
        ...state,
        activeUI: 'bootstrap'
      };
    case ACTIVATE_MATERIAL_UI:
      return {
        ...state,
        activeUI: 'material'
      };
    default:
      return state;
  }
};

export {
  batchSave,
  batchDiscard,
  createTestData,
  activateBootstrapUI,
  activateMaterialUI,
  createToolbarReducer,
  BATCH_SAVE,
  BATCH_DISCARD,
  CREATE_TEST_DATA,
  ACTIVATE_BOOTSTRAP_UI,
  ACTIVATE_MATERIAL_UI
};
