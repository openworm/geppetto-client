import React, { Component } from 'react';
import { withStyles } from '@material-ui/core';
import Canvas from '../../Canvas';
import model from './ca1_pyramidal_cell.json';
import CameraControls, {
  cameraControlsActions,
} from '../../../camera-controls/CameraControls';

const INSTANCE_NAME = 'network_CA1PyramidalCell';
const COLORS = [
  { r: 0, g: 0.29, b: 0.71, a: 1 },
  { r: 0.43, g: 0.57, b: 0, a: 1 },
  { r: 1, g: 0.41, b: 0.71, a: 1 },
];
const SELECTION_COLOR = { r: 0.8, g: 0.8, b: 0, a: 1 };

const styles = () => ({
  container: {
    height: '800px',
    width: '1400px',
    display: 'flex',
    alignItems: 'stretch',
  },
});
class CA1Example extends Component {
  constructor(props) {
    super(props);
    GEPPETTO.Manager.loadModel(model);
    Instances.getInstance(INSTANCE_NAME);
    this.canvasRef = React.createRef();

    this.state = {
      data: [
        {
          instancePath: 'network_CA1PyramidalCell.CA1_CG[0]',
          visualGroups: {
            index: 0,
            custom: {
              soma_group: {
                color: COLORS[0],
              },
              dendrite_group: {
                color: COLORS[1],
              },
              axon_group: {
                color: COLORS[2],
              },
            },
          },
        },
      ],
      selected: {},
      cameraOptions: {
        angle: 60,
        near: 10,
        far: 2000000,
        baseZoom: 1,
        position: { x: -97.349, y: 53.797, z: 387.82 },
        rotation: { rx: 0.051, ry: -0.192, rz: -0.569, radius: 361.668 },
        autoRotate: false,
        movieFilter: true,
        reset: false,
      },
    };

    this.lastCameraUpdate = null;

    this.cameraHandler = this.cameraHandler.bind(this);
    this.selectionHandler = this.selectionHandler.bind(this);
    this.cameraControlsHandler = this.cameraControlsHandler.bind(this);
  }

  cameraHandler(obj) {
    this.lastCameraUpdate = obj;

    console.log('Camera has changed:');
    console.log(obj);
  }

  selectionHandler(selectedMap) {
    const { data, selected } = this.state;
    let path;
    for (let sk in selectedMap) {
      const sv = selectedMap[sk];
      if (sv.distanceIndex === 0) {
        path = sk;
      }
    }
    const currentColor = selectedMap[path].object.material.color;
    const newData = data;
    const newSelected = selected;
    let done = false;
    for (const instance of data) {
      if (instance.instancePath == path) {
        if (path in newSelected) {
          instance.color = newSelected[path];
          delete newSelected[path];
        } else {
          newSelected[path] = instance.color;
          instance.color = SELECTION_COLOR;
        }
        done = true;
      }
    }
    if (!done) {
      newData.push({
        instancePath: path,
        color: SELECTION_COLOR,
      });
      newSelected[path] = { ...currentColor };
    }
    this.setState(() => ({ data: newData, selected: newSelected }));
    console.log('Selection Handler Called:');
    console.log({
      selectedMap,
    });
  }

  cameraControlsHandler(action) {
    const { cameraOptions } = this.state;
    if (this.canvasRef.current && this.canvasRef.current.threeDEngine) {
      const engine = this.canvasRef.current.threeDEngine;
      switch (action) {
        case cameraControlsActions.PAN_LEFT:
          engine.cameraManager.incrementCameraPan(-0.01, 0);
          break;
        case cameraControlsActions.PAN_RIGHT:
          engine.cameraManager.incrementCameraPan(0.01, 0);
          break;
        case cameraControlsActions.PAN_UP:
          engine.cameraManager.incrementCameraPan(0, -0.01);
          break;
        case cameraControlsActions.PAN_DOWN:
          engine.cameraManager.incrementCameraPan(0, 0.01);
          break;
        case cameraControlsActions.ROTATE_UP:
          engine.cameraManager.incrementCameraRotate(0, 0.01, undefined);
          break;
        case cameraControlsActions.ROTATE_DOWN:
          engine.cameraManager.incrementCameraRotate(0, -0.01, undefined);
          break;
        case cameraControlsActions.ROTATE_LEFT:
          engine.cameraManager.incrementCameraRotate(-0.01, 0, undefined);
          break;
        case cameraControlsActions.ROTATE_RIGHT:
          engine.cameraManager.incrementCameraRotate(0.01, 0, undefined);
          break;
        case cameraControlsActions.ROTATE_Z:
          engine.cameraManager.incrementCameraRotate(0, 0, 0.01);
          break;
        case cameraControlsActions.ROTATE_MZ:
          engine.cameraManager.incrementCameraRotate(0, 0, -0.01);
          break;
        case cameraControlsActions.ROTATE:
          engine.cameraManager.autoRotate(cameraOptions.movieFilter); //movie filter
          break;
        case cameraControlsActions.ZOOM_IN:
          engine.cameraManager.incrementCameraZoom(-0.1);
          break;
        case cameraControlsActions.ZOOM_OUT:
          engine.cameraManager.incrementCameraZoom(+0.1);
          break;
        case cameraControlsActions.PAN_HOME:
          this.setState(() => ({
            cameraOptions: { ...cameraOptions, reset: !cameraOptions.reset },
          }));
          break;
        case cameraControlsActions.WIREFRAME:
          engine.setWireframe(!engine.getWireframe());
          break;
      }
    }
  }

  render() {
    const { classes } = this.props;
    const { data, cameraOptions } = this.state;

    let camOptions = cameraOptions;
    if (this.lastCameraUpdate) {
      camOptions = {
        ...cameraOptions,
        position: this.lastCameraUpdate.position,
        rotation: {
          ...this.lastCameraUpdate.rotation,
          radius: cameraOptions.rotation.radius,
        },
      };
    }

    return (
      <div className={classes.container}>
        <Canvas
          ref={this.canvasRef}
          data={data}
          cameraOptions={camOptions}
          cameraHandler={this.cameraHandler}
          selectionHandler={this.selectionHandler}
          cameraControls={
            <CameraControls
              cameraControlsHandler={this.cameraControlsHandler}
              wireframeButtonEnabled={true}
            />
          }
          linesThreshold={10000}
        />
      </div>
    );
  }
}

export default withStyles(styles)(CA1Example);
