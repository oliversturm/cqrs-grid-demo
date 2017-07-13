import { call, put, takeEvery, select, fork, cancel } from 'redux-saga/effects';
import { delay } from 'redux-saga';

import {
  GRID_LOAD,
  GRID_PAGE_SIZE_CHANGE,
  GRID_FILTERS_CHANGE,
  GRID_STATE_CHANGE,
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

function* startLoadingTimer() {
  const threshold = yield select(state => state.grid.loadingIndicatorThreshold);
  yield delay(threshold);
  const loading = yield select(state => state.grid.loading);
  if (loading) yield put(gridStateChange('showLoadingIndicator', true));
}

function* gridLoadHandler(action) {
  yield put(gridStateChange('loading', true));
  const loadingTimer = yield fork(startLoadingTimer);
  const loadOptions = yield select(getLoadOptions);
  const data = yield call(loadData, loadOptions, action.force);
  if (data) yield put(gridDataLoaded(data));
  else yield put(gridStateChange('loading', false));
  yield cancel(loadingTimer);
  yield put(gridStateChange('showLoadingIndicator', false));
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

function* followWithGridLoad(action) {
  yield put(gridLoad());
}

function* gridStateChangeHandler(action) {
  if (
    ['sorting', 'currentPage', 'grouping', 'expandedGroups'].includes(
      action.stateFieldName
    )
  )
    yield* followWithGridLoad(action);
}

function* gridSaga() {
  yield takeEvery(GRID_LOAD, gridLoadHandler);
  yield takeEvery(BATCH_SAVE, batchSaveHandler);
  yield takeEvery(BATCH_DISCARD, batchDiscardHandler);
  yield takeEvery(GRID_PAGE_SIZE_CHANGE, followWithGridLoad);
  yield takeEvery(GRID_STATE_CHANGE, gridStateChangeHandler);
  yield takeEvery(GRID_FILTERS_CHANGE, followWithGridLoad);
}

export default gridSaga;
