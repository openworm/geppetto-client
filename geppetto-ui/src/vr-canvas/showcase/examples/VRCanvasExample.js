import React, { Component } from 'react';
import model from '../models';
import Canvas from '../../canvas/Canvas';

export default class VRCanvasExample extends Component {
  constructor (props) {
    super(props);
    this.state = { selectedModel: model, };
    const { selectedModel } = this.state;
    GEPPETTO.Manager.loadModel(selectedModel.model);
    this.instances = [];
    selectedModel.instances.forEach(instance =>
      this.instances.push(Instances.getInstance(instance))
    );
    this.canvasRef = React.createRef();
  }

  render () {
    const { selectedModel } = this.state;
    const {
      sceneBackground,
      colorMap,
      position,
      rotation,
    } = selectedModel.props;

    return (
      <div
        ref={this.canvasRef}
        id="CanvasContainer"
        style={{ position: 'relative', height: '100%', width: '100%' }}
      >
        {this.instances ? (
          <Canvas
            id="canvas1"
            model={selectedModel}
            instances={this.instances}
            colorMap={colorMap}
            position={position}
            rotation={rotation}
            sceneBackground={sceneBackground}
            embedded={true}
          />
        ) : (
          ''
        )}
      </div>
    );
  }
}
