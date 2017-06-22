import { call, takeEvery } from 'redux-saga/effects';

import { CREATE_TEST_DATA } from './toolbar-reducer';

import { createTestData } from './data-access';

function* createTestDataHandler(action) {
  yield call(createTestData);
}

function* toolbarSaga() {
  yield takeEvery(CREATE_TEST_DATA, createTestDataHandler);
}

export default toolbarSaga;
