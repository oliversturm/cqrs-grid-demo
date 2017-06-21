import React from 'react';
import { connect } from 'react-redux';
import { Button, ButtonToolbar } from 'react-bootstrap';

import { batchSave, batchDiscard } from './toolbar-reducer';
import { gridLoad } from './grid-reducer';

class Toolbar extends React.PureComponent {
  render() {
    const {
      gridHasEditingChanges,
      onReloadButtonClick,
      onSaveButtonClick,
      onDiscardButtonClick
    } = this.props;
    return (
      <ButtonToolbar>
        <Button bsStyle="danger">Create 1000 Test Objects</Button>
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
  onDiscardButtonClick: () => dispatch(batchDiscard())
});

const connectedToolbar = connect(mapStateToProps, mapDispatchToProps)(Toolbar);

export { connectedToolbar as Toolbar };
