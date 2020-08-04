import React, { Component } from 'react';
import Canvas from '../../Canvas';
import model from './auditory_cortex.json';
const INSTANCE_NAME = 'acnet2';

export default class CA1CellExample extends Component {
  constructor(props) {
    super(props);
    GEPPETTO.Manager.loadModel(model);
    Instances.getInstance(INSTANCE_NAME);
  }

  render() {
    const data = Instances.map((instance) => {
      return {
        instancePath: instance.getInstancePath(),
      };
    });

    const cameraOptions = {
      angle: 60,
      near: 10,
      far: 2000000,
    };

    // TODO: Use classNames instead of style
    return (
      <div
        style={{
          height: '800px',
          width: '800px',
          display: 'flex',
          alignItems: 'stretch',
        }}
      >
        <Canvas data={data} cameraOptions={cameraOptions} />
      </div>
    );
  }
}
