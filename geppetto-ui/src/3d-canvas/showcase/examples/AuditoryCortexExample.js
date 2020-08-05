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
  }

  render() {
    const { classes } = this.props;

    const data = [
      { instancePath: 'acnet2.baskets_12', color: COLORS[1] },
      { instancePath: 'acnet2' },
      { instancePath: 'acnet2.baskets_12[0]', color: COLORS[2] },
    ];

    const cameraOptions = {
      angle: 60,
      near: 10,
      far: 2000000,
      position: { x: 0, y: 0, z: 0 },
      baseZoom: 1,
    };

    // TODO: Use classNames instead of style
    return (
      <div className={classes.container}>
        <Canvas
          id={'auditory_cortex_canvas'}
          data={data}
          cameraOptions={cameraOptions}
        />
      </div>
    );
  }
}

export default withStyles(styles)(AuditoryCortexExample);
