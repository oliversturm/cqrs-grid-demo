import { call, put, takeEvery, select } from 'redux-saga/effects';

import { gridResetEditingState } from './grid-reducer';
import { BATCH_SAVE, BATCH_DISCARD } from './toolbar-reducer';

import { commitChanges } from './data-access';

function getCommitParams(state) {
  return {
    added: state.grid.addedRows,
    changed: state.grid.changedRows
  };
}

function* batchSaveHandler(action) {
  const commitParams = yield select(getCommitParams);
  yield call(commitChanges, commitParams);
  yield put(gridResetEditingState());
}

function* batchDiscardHandler(action) {
  yield put(gridResetEditingState());
}

function* gridSaga() {
  yield takeEvery(BATCH_SAVE, batchSaveHandler);
  yield takeEvery(BATCH_DISCARD, batchDiscardHandler);
}

export default gridSaga;
