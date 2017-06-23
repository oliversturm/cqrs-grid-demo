import React, { Component } from 'react';
import './App.css';

import { Provider } from 'react-redux';
import { createStore, applyMiddleware, compose, combineReducers } from 'redux';
import createSagaMiddleware from 'redux-saga';

import { Grid, gridReducer } from './Grid.js';
import gridSaga from './grid-saga';
import toolbarSaga from './toolbar-saga';

import { Toolbar, toolbarReducer } from './Toolbar.js';

import injectTapEventPlugin from 'react-tap-event-plugin';

import { MuiThemeProvider } from 'material-ui/styles';

const sagaMiddleware = createSagaMiddleware();

const composeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose;

const store = createStore(
  combineReducers({
    grid: gridReducer,
    toolbar: toolbarReducer
  }),
  composeEnhancers(applyMiddleware(sagaMiddleware))
);

sagaMiddleware.run(gridSaga);
sagaMiddleware.run(toolbarSaga);

injectTapEventPlugin();

class App extends Component {
  render() {
    return (
      <MuiThemeProvider>
        <div className="App">
          <Provider store={store}>
            <div>
              <Toolbar />
              <Grid />
            </div>
          </Provider>
        </div>
      </MuiThemeProvider>
    );
  }
}

export default App;
