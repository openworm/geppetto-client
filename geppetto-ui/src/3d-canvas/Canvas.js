import React, { Component } from 'react';
import { withStyles } from '@material-ui/core';
import PropTypes from 'prop-types';
import ThreeDEngine from './threeDEngine/ThreeDEngine';
import CameraControls, { cameraControlsActions } from '../camera-controls/CameraControls'


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
    this.cameraControlsHandler = this.cameraControlsHandler.bind(this);
  }

  componentDidMount() {
    const {
      data,
      cameraOptions,
      cameraHandler,
      selectionHandler,
      backgroundColor,
      id,
      pickingEnabled,
    } = this.props;
    this.threeDEngine = new ThreeDEngine(
      this.sceneRef.current,
      cameraOptions,
      cameraHandler,
      selectionHandler,
      backgroundColor,
      data,
      id,
      pickingEnabled,
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
    //TODO: check if new instance added, check if split meshes changed?
    return true;
  }

  cameraControlsHandler(action) {
    const {
      cameraOptions,
    } = this.props;
    if (this.threeDEngine) {
      switch (action) {
        case cameraControlsActions.PAN_LEFT:
          this.threeDEngine.cameraManager.incrementCameraPan(-0.01, 0)
          break;
        case cameraControlsActions.PAN_RIGHT:
          this.threeDEngine.cameraManager.incrementCameraPan(0.01, 0)
          break;
        case cameraControlsActions.PAN_UP:
          this.threeDEngine.cameraManager.incrementCameraPan(0, -0.01)
          break;
        case cameraControlsActions.PAN_DOWN:
          this.threeDEngine.cameraManager.incrementCameraPan(0, 0.01)
          break;
        case cameraControlsActions.ROTATE_UP:
          this.threeDEngine.cameraManager.incrementCameraRotate(0, 0.01, undefined)
          break;
        case cameraControlsActions.ROTATE_DOWN:
          this.threeDEngine.cameraManager.incrementCameraRotate(0, -0.01, undefined)
          break;
        case cameraControlsActions.ROTATE_LEFT:
          this.threeDEngine.cameraManager.incrementCameraRotate(-0.01, 0, undefined)
          break;
        case cameraControlsActions.ROTATE_RIGHT:
          this.threeDEngine.cameraManager.incrementCameraRotate(0.01, 0, undefined)
          break;
        case cameraControlsActions.ROTATE_Z:
          this.threeDEngine.cameraManager.incrementCameraRotate(0, 0, 0.01)
          break;
        case cameraControlsActions.ROTATE_MZ:
          this.threeDEngine.cameraManager.incrementCameraRotate(0, 0, -0.01)
          break;
        case cameraControlsActions.ROTATE:
          this.threeDEngine.cameraManager.autoRotate(cameraOptions.movieFilter)
          break;
        case cameraControlsActions.ZOOM_IN:
          this.threeDEngine.cameraManager.incrementCameraZoom(-0.1)
          break;
        case cameraControlsActions.ZOOM_OUT:
          this.threeDEngine.cameraManager.incrementCameraZoom(+0.1)
          break;
        case cameraControlsActions.PAN_HOME:
          this.threeDEngine.cameraManager.resetCamera()
          break;
      }
    }

  }

  render() {
    const { classes, data, hideCameraControls, cameraOptions } = this.props;
    let cameraControls;
    if (!hideCameraControls) {
      cameraControls = <CameraControls cameraControlsHandler={this.cameraControlsHandler} wireframeEnabled={cameraOptions.wireframeEnabled} />;
    }

    if (this.threeDEngine) {
      this.threeDEngine.update(data, cameraOptions, this.shouldEngineTraverse());
    }
    return <div className={classes.container} ref={this.sceneRef}>
      {cameraControls}
    </div>;
  }
}

Canvas.defaultProps = {
  cameraOptions: {
    angle: 60,
    near: 10,
    far: 2000000,
    position: { x: 0, y: 0, z: 0 },
    baseZoom: 1,
  },
  backgroundColor: '#000000',
  pickingEnabled: true,
  hideCameraControls: false,
};

Canvas.propTypes = {
  /**
   * Canvas identifier
   */
  id: PropTypes.string.isRequired,
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
  backgroundColor: PropTypes.string,
  /**
   * Boolean to enable/disable 3d picking
   */
  pickingEnabled: PropTypes.bool,
  /**
   * Boolean to enable/disable cameraControls
   */
  hideCameraControls: PropTypes.bool,
};

export default withStyles(styles)(Canvas);
