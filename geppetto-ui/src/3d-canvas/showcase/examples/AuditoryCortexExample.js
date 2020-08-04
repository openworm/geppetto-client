import React, { Component } from 'react';
import Canvas from '../../Canvas';
import model from './auditory_cortex.json';
const INSTANCE_NAME = 'acnet2';
const COLORS = [
  { r: 0, g: 0.2, b: 0.6, a: 1 },
  { r: 0.8, g: 0, b: 0, a: 1 },
];

export default class AuditoryCortexExample extends Component {
  constructor(props) {
    super(props);
    GEPPETTO.Manager.loadModel(model);
    Instances.getInstance(INSTANCE_NAME);
  }

  render() {
    const data = Instances.map((instance) => {
      return {
        instancePath: instance.getInstancePath(),
        color: instance.children.map((child, index) => {
          const key = `${instance.id}.${child.name}`;
          return {
            [key]: COLORS[index],
          };
        }),
      };
    });

    const cameraOptions = {
      angle: 60,
      near: 10,
      far: 2000000,
      position: { x: 0, y: 0, z: 0 },
      baseZoom: 1,
    };

    // TODO: Use classNames instead of style
    return (
      <div
        style={{
          height: '800px',
          width: '1400px',
          display: 'flex',
          alignItems: 'stretch',
        }}
      >
        <Canvas
          id={'auditory_cortex_canvas'}
          data={data}
          cameraOptions={cameraOptions}
        />
      </div>
    );
  }
}
