import { call, put, takeEvery, select } from 'redux-saga/effects';
import { delay } from 'redux-saga';

import {
  GRID_LOAD,
  gridDataLoaded,
  gridStateChange,
  gridLoad,
  gridResetEditingState
} from './grid-reducer';
import { BATCH_SAVE, BATCH_DISCARD } from './toolbar-reducer';

import { fetchData, commitChanges } from './data-access';

function getLoadOptions(state) {
  const {
    sorting,
    currentPage,
    pageSize,
    filters,
    grouping,
    expandedGroups
  } = state.grid;
  return {
    sorting,
    currentPage,
    pageSize,
    filters,
    grouping,
    expandedGroups
  };
}

function loadData(loadOptions, force) {
  if (force) loadOptions.force = true;
  return fetchData(loadOptions).then(res => {
    if (res.dataFetched) return res.data;
    else return undefined;
  });
}

function* gridLoadHandler(action) {
  const loadOptions = yield select(getLoadOptions);
  const data = yield call(loadData, loadOptions, action.force);
  if (data) yield put(gridDataLoaded(data));
  else yield put(gridStateChange('loading', false));
}

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
  yield put(gridLoad(true));
}

function* batchDiscardHandler(action) {
  yield put(gridResetEditingState());
}

function* gridSaga() {
  yield takeEvery(GRID_LOAD, gridLoadHandler);
  yield takeEvery(BATCH_SAVE, batchSaveHandler);
  yield takeEvery(BATCH_DISCARD, batchDiscardHandler);
}

export default gridSaga;
