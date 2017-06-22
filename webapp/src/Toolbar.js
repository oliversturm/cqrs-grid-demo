import React from 'react';
import { connect } from 'react-redux';
import { Button, ButtonToolbar, ButtonGroup } from 'react-bootstrap';

import {
  batchSave,
  batchDiscard,
  createTestData,
  activateBootstrapUI,
  activateMaterialUI,
  createToolbarReducer
} from './toolbar-reducer';
import { gridLoad } from './grid-reducer';

class Toolbar extends React.PureComponent {
  render() {
    const {
      gridHasEditingChanges,
      onReloadButtonClick,
      onSaveButtonClick,
      onDiscardButtonClick,
      onTestDataButtonClick,
      onBootstrapButtonClick,
      onMaterialButtonClick,
      activeUI
    } = this.props;
    return (
      <ButtonToolbar>
        <Button bsStyle="danger" onClick={onTestDataButtonClick}>
          Create 1000 Test Objects
        </Button>
        <Button onClick={onReloadButtonClick}>Reload Grid</Button>
        <Button
          bsStyle="success"
          disabled={!gridHasEditingChanges}
          onClick={onSaveButtonClick}
        >
          Save Changes
        </Button>
        <Button
          bsStyle="danger"
          disabled={!gridHasEditingChanges}
          onClick={onDiscardButtonClick}
        >
          Discard Changes
        </Button>
        <ButtonGroup>
          <Button
            active={activeUI === 'bootstrap'}
            onClick={onBootstrapButtonClick}
          >
            Bootstrap UI
          </Button>
          <Button
            active={activeUI === 'material'}
            onClick={onMaterialButtonClick}
          >
            Material UI
          </Button>
        </ButtonGroup>
      </ButtonToolbar>
    );
  }
}

const mapStateToProps = state => ({
  gridHasEditingChanges: state.grid.hasEditingChanges
});

const mapDispatchToProps = dispatch => ({
  onReloadButtonClick: () => dispatch(gridLoad(true)),
  onSaveButtonClick: () => dispatch(batchSave()),
  onDiscardButtonClick: () => dispatch(batchDiscard()),
  onTestDataButtonClick: () => dispatch(createTestData()),
  onBootstrapButtonClick: () => dispatch(activateBootstrapUI()),
  onMaterialButtonClick: () => dispatch(activateMaterialUI())
});

const connectedToolbar = connect(mapStateToProps, mapDispatchToProps)(Toolbar);

const toolbarReducer = createToolbarReducer({
  activeUI: 'bootstrap'
});

export { connectedToolbar as Toolbar, toolbarReducer };
