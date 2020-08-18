import React, { Component } from 'react';
import { withStyles } from '@material-ui/core';
import Canvas from '../../Canvas';
import CameraControls, {
  cameraControlsActions,
} from '../../../camera-controls/CameraControls';

const INSTANCES = [
  'VFB_00017894',
  'VFB_00030624',
  'VFB_00030622',
  'VFB_00030616',
  'VFB_00030633',
  'VFB_00030840',
  'VFB_00030632',
  'VFB_00030783',
];
const COLORS = [
  { r: 0.36, g: 0.36, b: 0.36, a: 1 },
  { r: 0, g: 1, b: 0, a: 1 },
  { r: 1, g: 0, b: 1, a: 1 },
  { r: 0, g: 0, b: 1, a: 1 },
  { r: 1, g: 0.83, b: 0, a: 1 },
  { r: 0, g: 0.52, b: 0.96, a: 1 },
  { r: 1, g: 0, b: 0, a: 1 },
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
class VFBExample extends Component {
  constructor(props) {
    super(props);
    for (const iname of INSTANCES) {
      Instances.getInstance(iname);
    }
    this.canvasRef = React.createRef();
    this.state = {
      data: [
        {
          instancePath: 'VFB_00017894',
          color: COLORS[0],
        },
        {
          instancePath: 'VFB_00030622',
          color: COLORS[1],
        },
        {
          instancePath: 'VFB_00030616',
          color: COLORS[2],
        },
        {
          instancePath: 'VFB_00030633',
          color: COLORS[3],
        },
        {
          instancePath: 'VFB_00030840',
          color: COLORS[4],
        },
        {
          instancePath: 'VFB_00030632',
          color: COLORS[5],
        },
        {
          instancePath: 'VFB_00030624',
        },
        {
          instancePath: 'VFB_00030783',
          color: COLORS[6],
        },
      ],
      selected: {},
      cameraOptions: {
        angle: 60,
        near: 10,
        far: 2000000,
        baseZoom: 1,
        position: { x: 319.7, y: 153.12, z: -494.2 },
        rotation: { rx: -3.14, ry: 0, rz: -3.14, radius: 559.83 },
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
    const geometryIdentifier = selectedMap[path].geometryIdentifier;
    const newData = data;
    const newSelected = selected;
    let done = false;
    for (const instance of newData) {
      if (instance.instancePath == path) {
        if (geometryIdentifier == '') {
          if (path in newSelected) {
            instance.color = newSelected[path].color;
            delete newSelected[path];
          } else {
            newSelected[path] = { color: instance.color };
            instance.color = SELECTION_COLOR;
          }
          done = true;
        } else {
          if (path in newSelected) {
            if (geometryIdentifier in newSelected[path]) {
              instance.visualGroups.custom[geometryIdentifier].color =
                newSelected[path][geometryIdentifier].color;
              delete newSelected[path][geometryIdentifier];
              if (Object.keys(newSelected[path]).length === 0) {
                delete newSelected[path];
              }
              done = true;
            } else {
              if (instance.visualGroups.custom[geometryIdentifier]) {
                newSelected[path][geometryIdentifier] = {
                  color: instance.visualGroups.custom[geometryIdentifier].color,
                };
                instance.visualGroups.custom[
                  geometryIdentifier
                ].color = SELECTION_COLOR;
                done = true;
              }
            }
          } else {
            if (instance.visualGroups) {
              if (instance.visualGroups.custom) {
                if (instance.visualGroups.custom[geometryIdentifier]) {
                  newSelected[path] = {
                    [geometryIdentifier]: {
                      color:
                        instance.visualGroups.custom[geometryIdentifier].color,
                    },
                  };
                  instance.visualGroups.custom[
                    geometryIdentifier
                  ].color = SELECTION_COLOR;
                  done = true;
                } else {
                  newSelected[path] = {
                    [geometryIdentifier]: {
                      color: {
                        ...currentColor,
                      },
                    },
                  };
                  instance.visualGroups.custom[geometryIdentifier] = {
                    color: SELECTION_COLOR,
                  };
                  done = true;
                }
              } else {
                newSelected[path] = {
                  [geometryIdentifier]: {
                    color: {
                      ...currentColor,
                    },
                  },
                };
                instance.visualGroups.custom = {
                  [geometryIdentifier]: { color: SELECTION_COLOR },
                };
                done = true;
              }
            }
          }
        }
      }
    }
    if (!done) {
      newData.push({
        instancePath: path,
        color: SELECTION_COLOR,
      });
      newSelected[path] = { color: { ...currentColor } };
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
          engine.cameraManager.autoRotate(cameraOptions.movieFilter);
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

export default withStyles(styles)(VFBExample);
