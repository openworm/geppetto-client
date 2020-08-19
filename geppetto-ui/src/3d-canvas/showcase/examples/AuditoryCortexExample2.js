import React, { Component } from 'react';
import { withStyles } from '@material-ui/core';
import Canvas from '../../Canvas';
import CameraControls, {
  cameraControlsActions,
} from '../../../camera-controls/CameraControls';

const INSTANCE_NAME = 'acnet2';
const COLORS = [
  { r: 0, g: 0.2, b: 0.6, a: 1 },
  { r: 0.8, g: 0, b: 0, a: 1 },
  { r: 0, g: 0.8, b: 0, a: 1 },
  { r: 0, g: 0.8, b: 0, a: 0.5 },
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
class AuditoryCortexExample2 extends Component {
  constructor(props) {
    super(props);
    this.canvasRef = React.createRef();

    this.state = {
      data: [
        {
          instancePath: 'acnet2.baskets_12',
          color: COLORS[1],
        },
        { instancePath: 'acnet2' },
        {
          instancePath: 'acnet2.baskets_12[0]',
          color: COLORS[2],
        },
        {
          instancePath: 'acnet2.baskets_12[7]',
          color: COLORS[3],
        },
      ],
      selected: {},
      cameraOptions: {
        angle: 60,
        near: 10,
        far: 2000000,
        baseZoom: 1,
        autoRotate: false,
        movieFilter: false,
        reset: false,
        zoomTo: ['acnet2.baskets_12[7]'],
        flip: 'y',
      },
    };

    this.lastCameraUpdate = null;
    this.cameraHandler = this.cameraHandler.bind(this);
    this.selectionHandler = this.selectionHandler.bind(this);
    this.cameraControlsHandler = this.cameraControlsHandler.bind(this);
    this.hoverHandler = this.hoverHandler.bind(this);
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

  hoverHandler(obj) {
    console.log('Hover handler called:');
    console.log(obj);
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
              wireframeButtonEnabled={false}
            />
          }
          backgroundColor={0x505050}
          hoverListeners={[this.hoverHandler]}
        />
      </div>
    );
  }
}

export default withStyles(styles)(AuditoryCortexExample2);
