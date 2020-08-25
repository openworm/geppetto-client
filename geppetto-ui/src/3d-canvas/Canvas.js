import React, { Component } from 'react';
import { withStyles } from '@material-ui/core';
import PropTypes from 'prop-types';
import ThreeDEngine from './threeDEngine/ThreeDEngine';
import {
  cameraControlsActions,
} from '../camera-controls/CameraControls';

const styles = () => ({
  container: {
    display: 'flex',
    alignItems: 'stretch',
    flex: 1,
  },
});

class Canvas extends Component {
  constructor(props) {
    super(props);
    this.sceneRef = React.createRef();
    this.cameraControls = React.createRef();
    this.cameraControlsHandler = this.cameraControlsHandler.bind(this);
  }

  componentDidMount() {
    const {
      data,
      cameraOptions,
      cameraHandler,
      selectionHandler,
      backgroundColor,
      pickingEnabled,
      linesThreshold,
      hoverListeners,
    } = this.props;
    this.threeDEngine = new ThreeDEngine(
      this.sceneRef.current,
      cameraOptions,
      cameraHandler,
      selectionHandler,
      backgroundColor,
      pickingEnabled,
      linesThreshold,
      hoverListeners
    );
    this.threeDEngine.start(data, cameraOptions, true);
  }

  componentWillUnmount() {
    this.threeDEngine.stop();
    this.sceneRef.current.removeChild(
      this.threeDEngine.getRenderer().domElement
    );
  }

  shouldEngineTraverse() {
    // TODO: check if new instance added, check if split meshes changed?
    return true;
  }

  cameraControlsHandler(action) {
    const { cameraOptions } = this.props;
    const { incrementPan, incrementRotation, incrementZoom, movieFilter } = cameraOptions;
    
    if (this.threeDEngine) {
      switch (action) {
        case cameraControlsActions.PAN_LEFT:
          this.threeDEngine.cameraManager.incrementCameraPan(-incrementPan.x, 0);
          break;
        case cameraControlsActions.PAN_RIGHT:
          this.threeDEngine.cameraManager.incrementCameraPan(incrementPan.x, 0);
          break;
        case cameraControlsActions.PAN_UP:
          this.threeDEngine.cameraManager.incrementCameraPan(0, -incrementPan.y);
          break;
        case cameraControlsActions.PAN_DOWN:
          this.threeDEngine.cameraManager.incrementCameraPan(0, incrementPan.y);
          break;
        case cameraControlsActions.ROTATE_UP:
          this.threeDEngine.cameraManager.incrementCameraRotate(0, incrementRotation.y, undefined);
          break;
        case cameraControlsActions.ROTATE_DOWN:
          this.threeDEngine.cameraManager.incrementCameraRotate(0, -incrementRotation.y, undefined);
          break;
        case cameraControlsActions.ROTATE_LEFT:
          this.threeDEngine.cameraManager.incrementCameraRotate(-incrementRotation.x, 0, undefined);
          break;
        case cameraControlsActions.ROTATE_RIGHT:
          this.threeDEngine.cameraManager.incrementCameraRotate(incrementRotation.x, 0, undefined);
          break;
        case cameraControlsActions.ROTATE_Z:
          this.threeDEngine.cameraManager.incrementCameraRotate(0, 0, incrementRotation.z);
          break;
        case cameraControlsActions.ROTATE_MZ:
          this.threeDEngine.cameraManager.incrementCameraRotate(0, 0, -incrementRotation.z);
          break;
        case cameraControlsActions.ROTATE:
          this.threeDEngine.cameraManager.autoRotate(movieFilter); //movie filter
          break;
        case cameraControlsActions.ZOOM_IN:
          this.threeDEngine.cameraManager.incrementCameraZoom(-incrementZoom);
          break;
        case cameraControlsActions.ZOOM_OUT:
          this.threeDEngine.cameraManager.incrementCameraZoom(incrementZoom);
          break;
        case cameraControlsActions.PAN_HOME:
          this.threeDEngine.cameraManager.resetCamera();
          break;
        case cameraControlsActions.WIREFRAME:
          this.threeDEngine.setWireframe(!this.threeDEngine.getWireframe());
          break;
      }
    }
  }

  render() {
    const { classes, data, cameraOptions } = this.props;

    if (this.threeDEngine) {
      this.threeDEngine.update(
        data,
        cameraOptions,
        this.shouldEngineTraverse()
      );
    }
    return (
      <div className={classes.container} ref={this.sceneRef}>
        {
          <cameraOptions.cameraControls.instance
          ref={this.cameraControls} 
          wireframeButtonEnabled={cameraOptions.cameraControls.props.wireframeButtonEnabled}
          cameraControlsHandler={this.cameraControlsHandler}
          />
        }
      </div>
    );
  }
}

Canvas.defaultProps = {
  cameraOptions: {
    angle: 60,
    near: 10,
    far: 2000000,
    position: { x: 0, y: 0, z: 0 },
    baseZoom: 1,
    incrementPan: {
      x:0.01,
      y:0.01
    },
    incrementRotation: {
      x:0.01,
      y:0.01,
      z:0.01,
    },
    incrementZoom: 0.1,
    reset: false,
    movieFilter:false,
    autorotate:false,
    wireframe:false
  },
  backgroundColor: 0x000000,
  pickingEnabled: true,
  linesThreshold: 2000,
  hoverListeners: [],
};

Canvas.propTypes = {
  /**
   * (Proxy) Instances to visualize
   */
  data: PropTypes.array.isRequired,
  /**
   * Options to customize camera
   */
  cameraOptions: PropTypes.object,
  /**
   * Function to callback on camera changes
   */
  cameraHandler: PropTypes.func,
  /**
   * Function to callback on selection changes
   */
  selectionHandler: PropTypes.func,
  /**
   * Scene background color
   */
  backgroundColor: PropTypes.number,
  /**
   * Boolean to enable/disable 3d picking
   */
  pickingEnabled: PropTypes.bool,
  /**
   * Camera Controls
   */
  cameraControls: PropTypes.object,
  /**
   * Threshold to limit scene complexity
   */
  linesThreshold: PropTypes.number,
  /**
   * Array of hover handlers to callback
   */
  hoverListeners: PropTypes.array,
};

export default withStyles(styles)(Canvas);
