import React, { Component } from 'react';
import { withStyles } from '@material-ui/core';
import PropTypes from 'prop-types';
import ThreeDEngine from './threeDEngine/ThreeDEngine';



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
  }

  componentDidMount() {
    const {
      data,
      cameraOptions,
      cameraHandler,
      selectionHandler,
      backgroundColor,
      pickingEnabled,
      linesThreshold
    } = this.props;
    this.threeDEngine = new ThreeDEngine(
      this.sceneRef.current,
      cameraOptions,
      cameraHandler,
      selectionHandler,
      backgroundColor,
      pickingEnabled,
      linesThreshold
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

  render() {
    const { classes, data, cameraOptions, cameraControls } = this.props;

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
  linesThreshold: 2000,
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
  backgroundColor: PropTypes.string,
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
  linesThreshold: PropTypes.number
};

export default withStyles(styles)(Canvas);
