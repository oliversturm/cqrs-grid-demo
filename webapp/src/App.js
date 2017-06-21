import React, { Component } from 'react';
import './App.css';

import { Provider } from 'react-redux';
import { createStore, applyMiddleware, compose } from 'redux';
import createSagaMiddleware from 'redux-saga';

import { Grid, gridReducer } from './Grid.js';
import gridSaga from './grid-saga';

import { Toolbar } from './Toolbar.js';

const sagaMiddleware = createSagaMiddleware();

const composeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose;

const store = createStore(
  gridReducer,
  composeEnhancers(applyMiddleware(sagaMiddleware))
);

sagaMiddleware.run(gridSaga);

class App extends Component {
  render() {
    return (
      <div className="App">
        <Provider store={store}>
          <div>
            <Toolbar />
            <Grid />
          </div>
        </Provider>
      </div>
    );
  }
}

export default App;
