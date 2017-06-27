import React from 'react';
import { connect } from 'react-redux';
import {
  Button as BsButton,
  ButtonToolbar as BsButtonToolbar,
  ButtonGroup as BsButtonGroup
} from 'react-bootstrap';

import {
  Toolbar as MuiToolbar,
  Button as MuiButton,
  // Toggle would be prettier, but it's not ported yet
  LabelCheckbox as MuiCheckbox
} from 'material-ui';

import {
  batchSave,
  batchDiscard,
  createTestData,
  activateBootstrapUI,
  activateMaterialUI,
  switchCustomEditors,
  createToolbarReducer
} from './toolbar-reducer';

class ToolbarX extends React.PureComponent {
  render() {
    const {
      gridHasEditingChanges,
      onReloadButtonClick,
      onSaveButtonClick,
      onDiscardButtonClick,
      onTestDataButtonClick,
      onBootstrapButtonClick,
      onMaterialButtonClick,
      activeUI,
      useCustomEditors,
      onCustomEditorsToggled
    } = this.props;
    if (activeUI === 'bootstrap') {
      return (
        <BsButtonToolbar>
          <BsButton bsStyle="danger" onClick={onTestDataButtonClick}>
            Create 1000 Test Objects
          </BsButton>
          <BsButton onClick={onReloadButtonClick}>Reload Grid</BsButton>
          <BsButton
            bsStyle="success"
            disabled={!gridHasEditingChanges}
            onClick={onSaveButtonClick}
          >
            Save Changes
          </BsButton>
          <BsButton
            bsStyle="danger"
            disabled={!gridHasEditingChanges}
            onClick={onDiscardButtonClick}
          >
            Discard Changes
          </BsButton>
          <BsButtonGroup>
            <BsButton
              active={activeUI === 'bootstrap'}
              onClick={onBootstrapButtonClick}
            >
              Bootstrap UI
            </BsButton>
            <BsButton
              active={activeUI === 'material'}
              onClick={onMaterialButtonClick}
            >
              Material UI
            </BsButton>
            <BsButton
              active={useCustomEditors}
              onClick={() => onCustomEditorsToggled(!useCustomEditors)}
            >
              Use Custom Editors
            </BsButton>
          </BsButtonGroup>
        </BsButtonToolbar>
      );
    } else if (activeUI === 'material') {
      return (
        <MuiToolbar>
          <MuiToolbar>
            <MuiButton onTouchTap={onTestDataButtonClick}>
              Create 1000 Test Objects
            </MuiButton>
          </MuiToolbar>
          <MuiToolbar>
            <MuiButton onTouchTap={onReloadButtonClick}>Reload Grid</MuiButton>
            <MuiButton
              onTouchTap={onSaveButtonClick}
              disabled={!gridHasEditingChanges}
            >
              Save Changes
            </MuiButton>
            <MuiButton
              onTouchTap={onDiscardButtonClick}
              disabled={!gridHasEditingChanges}
            >
              Discard Changes
            </MuiButton>
          </MuiToolbar>
          <MuiToolbar>
            <MuiButton
              color={activeUI === 'bootstrap' ? 'accent' : 'default'}
              onTouchTap={onBootstrapButtonClick}
            >
              Bootstrap UI
            </MuiButton>
            <MuiButton
              color={activeUI === 'material' ? 'accent' : 'default'}
              onTouchTap={onMaterialButtonClick}
            >
              Material UI
            </MuiButton>
            <MuiCheckbox
              label="Use Custom Editors"
              checked={useCustomEditors}
              onChange={(e, checked) => onCustomEditorsToggled(checked)}
            />

          </MuiToolbar>
        </MuiToolbar>
      );
    } else return undefined; // no idea what UI this is :)
  }
}

const mapStateToProps = state => ({
  ...state.toolbar,
  gridHasEditingChanges: state.grid.hasEditingChanges
});

const mapDispatchToProps = dispatch => ({
  onReloadButtonClick: () => undefined,
  onSaveButtonClick: () => dispatch(batchSave()),
  onDiscardButtonClick: () => dispatch(batchDiscard()),
  onTestDataButtonClick: () => dispatch(createTestData()),
  onBootstrapButtonClick: () => dispatch(activateBootstrapUI()),
  onMaterialButtonClick: () => dispatch(activateMaterialUI()),
  onCustomEditorsToggled: checked => dispatch(switchCustomEditors(checked))
});

const connectedToolbar = connect(mapStateToProps, mapDispatchToProps)(ToolbarX);

const toolbarReducer = createToolbarReducer({
  activeUI: 'material',
  useCustomEditors: true
});

export { connectedToolbar as Toolbar, toolbarReducer };
