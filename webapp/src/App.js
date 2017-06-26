import React, { Component } from 'react';
import './App.css';

import { Provider } from 'react-redux';
import { createStore, applyMiddleware, compose, combineReducers } from 'redux';
import createSagaMiddleware from 'redux-saga';

import { connectRoutes } from 'redux-first-router';
import createHistory from 'history/createBrowserHistory';

import { Grid, gridReducer } from './Grid.js';
import gridSaga from './grid-saga';
import toolbarSaga from './toolbar-saga';

import { Toolbar, toolbarReducer } from './Toolbar.js';

import injectTapEventPlugin from 'react-tap-event-plugin';

import { MuiThemeProvider } from 'material-ui/styles';

import { ACTIVATE_BOOTSTRAP_UI, ACTIVATE_MATERIAL_UI } from './toolbar-reducer';

const sagaMiddleware = createSagaMiddleware();

const composeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose;

const routeMap = {
  [ACTIVATE_BOOTSTRAP_UI]: '/grid/bootstrap',
  [ACTIVATE_MATERIAL_UI]: '/grid/material'
};

const {
  reducer: routingReducer,
  middleware: routingMiddleware,
  enhancer: routingEnhancer
} = connectRoutes(createHistory(), routeMap);

const reducer = combineReducers({
  location: routingReducer,
  grid: gridReducer,
  toolbar: toolbarReducer
});
const middleware = applyMiddleware(sagaMiddleware, routingMiddleware);
const enhancers = composeEnhancers(routingEnhancer, middleware);

const store = createStore(reducer, enhancers);

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
