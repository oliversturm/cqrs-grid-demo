import { call, put, takeEvery, select } from 'redux-saga/effects';
import { delay } from 'redux-saga';

import { gridResetEditingState, gridReload } from './grid-reducer';
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
  // Without the delay, the grid reacts so quickly that we won't
  // see the change coming back from the service. Delaying may
  // not be the most elegant option in reality, but then this
  // part of the demo doesn't have change notifications.
  yield delay(100);
  yield put(gridReload());
}

function* batchDiscardHandler(action) {
  yield put(gridResetEditingState());
}

function* gridSaga() {
  yield takeEvery(BATCH_SAVE, batchSaveHandler);
  yield takeEvery(BATCH_DISCARD, batchDiscardHandler);
}

export default gridSaga;
