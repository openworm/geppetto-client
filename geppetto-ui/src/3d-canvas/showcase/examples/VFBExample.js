import React, { Component } from 'react';
import { withStyles } from '@material-ui/core';
import Canvas from '../../Canvas';
import CameraControls from '../../../camera-controls/CameraControls';
import model from './model.json';

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
    width: '1240px',
    display: 'flex',
    alignItems: 'stretch',
  },
});
class VFBExample extends Component {
  constructor(props) {
    super(props);
    GEPPETTO.Manager.loadModel(model);
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
/*         {
          instancePath: 'VFB_00030783',
          color: COLORS[6],
        }, */
      ],
      selected: {},
      cameraOptions: {
        angle: 60,
        near: 10,
        far: 2000000,
        baseZoom: 1,
        position: { x: 319.7, y: 153.12, z: -494.2 },
        rotation: { rx: -3.14, ry: 0, rz: -3.14, radius: 559.83 },
        cameraControls: { 
          instance: CameraControls,
          props: {
            wireframeButtonEnabled: true,
          }
        },
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
        movieFilter: false,
        autorotate:false,
        wireframe:false
      },
    };

    this.lastCameraUpdate = null;
    this.cameraHandler = this.cameraHandler.bind(this);
    this.selectionHandler = this.selectionHandler.bind(this);
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
          linesThreshold={10000}
          backgroundColor={0x505050}
        />
      </div>
    );
  }
}

export default withStyles(styles)(VFBExample);
