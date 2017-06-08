import React, { Component } from 'react';
import './App.css';

import { Provider } from 'react-redux';
import { createStore } from 'redux';

import { Grid, gridReducer } from './Grid.js';

const store = createStore(
  gridReducer,
  window.__REDUX_DEVTOOLS_EXTENSION__ && window.__REDUX_DEVTOOLS_EXTENSION__()
);

class App extends Component {
  render() {
    return (
      <div className="App">
        <Provider store={store}>
          <Grid />
        </Provider>
      </div>
    );
  }
}

export default App;
