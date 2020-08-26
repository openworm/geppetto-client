import React, { Component } from 'react';
import { withStyles } from '@material-ui/core';
import Canvas from '../../Canvas';
import CameraControls from '../../../camera-controls/CameraControls';
import model from './simpleModel.json';

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
    width: '1240px',
    display: 'flex',
    alignItems: 'stretch',
  },
});
class AuditoryCortexExample2 extends Component {
  constructor(props) {
    super(props);
    this.canvasRef = React.createRef();
    GEPPETTO.Manager.loadModel(model);
    Instances.getInstance(INSTANCE_NAME);
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
        flip: ['z'],
        baseZoom: 1,
        zoomTo: ['acnet2.baskets_12[7]'],
        cameraControls: { 
          instance: CameraControls,
          props: {
            wireframeButtonEnabled: false,
          }
        },
        incrementPan: {
          x:0.05,
          y:0.05
        },
        incrementRotation: {
          x:0.05,
          y:0.05,
          z:0.05,
        },
        incrementZoom: 0.5,
        reset: false,
        movieFilter: false,
        autorotate:false,
        wireframe:false
      },
    };

    this.lastCameraUpdate = null;
    this.cameraHandler = this.cameraHandler.bind(this);
    this.selectionHandler = this.selectionHandler.bind(this);
    this.hoverHandler = this.hoverHandler.bind(this);
  }

  cameraHandler(obj) {
    this.lastCameraUpdate = obj;
    console.log('Camera has changed:');
    console.log(obj);
  }

  selectionHandler(
    selectedMap
  ) {
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
    const newSelected = selected
    let done = false;
    for (const instance of data) {
      if (instance.instancePath == path) {
        if (path in newSelected) {
          instance.color = newSelected[path];
          instance.showConnectionLines = false;
          delete newSelected[path];
        } else {
          newSelected[path] = instance.color;
          instance.color = SELECTION_COLOR;
          instance.showConnectionLines = true;
        }
        done = true;
      }
    }
    if (!done) {
      newData.push({
        instancePath: path,
        color: SELECTION_COLOR,
        showConnectionLines: true,
      });
      newSelected[path] = { ...currentColor };
    }
    this.setState(() => ({ data: newData, selected: newSelected }));
    console.log({
      selectedMap
    })
  }

  hoverHandler(obj) {
    console.log('Hover handler called:');
    console.log(obj);
  }

  render() {
    const { classes } = this.props;
    const { data, cameraOptions } = this.state;

    let camOptions = cameraOptions;
    if (this.lastCameraUpdate) {
      camOptions = {
        ...cameraOptions,
        position: this.lastCameraUpdate.position,
        zoomTo: [],
        flip: []
      };
      if(this.lastCameraUpdate.rotation.radius){
        camOptions = {
          ...cameraOptions,
          rotation: this.lastCameraUpdate.rotation,
        };
      }
    }

    return (
      <div className={classes.container}>
        <Canvas
          ref={this.canvasRef}
          data={data}
          cameraOptions={camOptions}
          cameraHandler={this.cameraHandler}
          selectionHandler={this.selectionHandler}
          backgroundColor={0x505050}
          hoverListeners={[this.hoverHandler]}
        />
      </div>
    );
  }
}

export default withStyles(styles)(AuditoryCortexExample2);
