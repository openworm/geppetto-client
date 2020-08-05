import React, { Component } from 'react';
import { withStyles } from '@material-ui/core';
import Canvas from '../../Canvas';
import model from './auditory_cortex.json';
const INSTANCE_NAME = 'acnet2';
const COLORS = [
  { r: 0, g: 0.2, b: 0.6, a: 1 },
  { r: 0.8, g: 0, b: 0, a: 1 },
  { r: 0, g: 0.8, b: 0, a: 1 },
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
class AuditoryCortexExample extends Component {
  constructor(props) {
    super(props);
    GEPPETTO.Manager.loadModel(model);
    Instances.getInstance(INSTANCE_NAME);
    this.cameraHandler = this.cameraHandler.bind(this);
    this.selectionHandler = this.selectionHandler.bind(this);
    this.state = {
      data: [
        {
          instancePath: 'acnet2.baskets_12',
          color: COLORS[1],
          isSelected: false,
        },
        { instancePath: 'acnet2', isSelected: false },
        {
          instancePath: 'acnet2.baskets_12[0]',
          color: COLORS[2],
          isSelected: false,
        },
      ],
    };
  }

  cameraHandler(obj) {
    console.log('Camera has changed');
    console.log(obj);
  }

  selectionHandler(
    path,
    geometryIdentifier,
    selectedIntersectCoordinates,
    currentColor
  ) {
    const { data } = this.state;
    const newData = data;
    //TODO: geometryIdentifier and selectedIntersectCoordinates
    let done = false;
    for (const instance of data) {
      if (instance.instancePath == path) {
        if (instance.isSelected) {
          instance.color = instance.originalColor;
          instance.isSelected = false;
        } else {
          instance.originalColor = instance.color;
          instance.color = SELECTION_COLOR;
          instance.isSelected = true;
        }
        done = true;
      }
    }
    if (!done) {
      newData.push({
        instancePath: path,
        originalColor: { ...currentColor },
        color: SELECTION_COLOR,
        isSelected: true,
      });
    }
    this.setState(() => ({ data: newData }));
  }

  render() {
    const { classes } = this.props;
    const { data } = this.state;

    const cameraOptions = {
      angle: 60,
      near: 10,
      far: 2000000,
      baseZoom: 1,
    };

    return (
      <div className={classes.container}>
        <Canvas
          id={'auditory_cortex_canvas'}
          data={data}
          cameraOptions={cameraOptions}
          cameraHandler={this.cameraHandler}
          selectionHandler={this.selectionHandler}
        />
      </div>
    );
  }
}

export default withStyles(styles)(AuditoryCortexExample);
