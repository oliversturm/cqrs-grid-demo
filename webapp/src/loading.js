import React from 'react';
import './loading.css';
import { CircularProgress as MuiCircularProgress } from 'material-ui';

function BsLoading() {
  return (
    <div className="loading-shading">
      <span className="glyphicon glyphicon-refresh loading-icon" />
    </div>
  );
}

function MuiLoading() {
  return (
    <div className="loading-shading">
      <MuiCircularProgress className="loading-progress" />
    </div>
  );
}

export { BsLoading, MuiLoading };
