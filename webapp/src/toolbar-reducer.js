const BATCH_SAVE = 'BATCH_SAVE';
const BATCH_DISCARD = 'BATCH_DISCARD';
const CREATE_TEST_DATA = 'CREATE_TEST_DATA';

const batchSave = () => ({
  type: BATCH_SAVE
});

const batchDiscard = () => ({
  type: BATCH_DISCARD
});

const createTestData = () => ({
  type: CREATE_TEST_DATA
});

export {
  batchSave,
  batchDiscard,
  createTestData,
  BATCH_SAVE,
  BATCH_DISCARD,
  CREATE_TEST_DATA
};
