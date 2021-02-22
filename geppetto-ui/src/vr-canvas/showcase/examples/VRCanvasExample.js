import React, { Component } from 'react';
import Canvas from '../../canvas/Canvas';
import Loader from "@geppettoengine/geppetto-ui/loader/Loader";
export default class VRCanvasExample extends Component {
  constructor (props) {
    super(props);
    this.state = { model: null, }
    this.canvasRef = React.createRef();
  }

  componentDidMount () {
    Promise.all([
      import(/* webpackChunkName: "vr_model" */'./auditory_cortex.json'),
      import(/* webpackChunkName: "vr_mapping" */'./rawRecording_auditory/outputMapping.dat'),
      import(/* webpackChunkName: "vr_results" */'./rawRecording_auditory/results0.dat'),
      import(/* webpackChunkName: "vr_results" */'./rawRecording_auditory/results1.dat'),
      import(/* webpackChunkName: "vr_results" */'./rawRecording_auditory/results2.dat'),
      import(/* webpackChunkName: "vr_results" */'./rawRecording_auditory/results3.dat'),
      import(/* webpackChunkName: "vr_results" */'./rawRecording_auditory/results4.dat'),
      import(/* webpackChunkName: "vr_results" */'./rawRecording_auditory/results5.dat'),
    ]).then(([auditoryCortex, auditoryOutputMapping, auditoryResults0,auditoryResults1,
              auditoryResults2, auditoryResults3, auditoryResults4, auditoryResults5]) => {
      const model = {
        name: 'auditory_cortex',
        model: auditoryCortex,
        props: {
          colorMap: {
            'acnet2.baskets_12': { r: 0, g: 0.2, b: 0.6, a: 1 },
            'acnet2.pyramidals_48': { r: 0.8, g: 0, b: 0, a: 1 },
          },
          position: '-20 16 -80',
        },
        imageID: '#auditory_cortex',
        instances: ['acnet2'],
        color: '#F85333',
        visualGroups: false,
        simulation: {
          outputMapping: auditoryOutputMapping,
          results: [
            auditoryResults0,
            auditoryResults1,
            auditoryResults2,
            auditoryResults3,
            auditoryResults4,
            auditoryResults5,
          ],
          step: 1,
        },
      };

      GEPPETTO.Manager.loadModel(model.model);
      this.instances = [];
      model.instances.forEach(instance =>
        this.instances.push(Instances.getInstance(instance))
      );
      this.setState({ selectedModel: model })
    })
  }

  render () {
    const { selectedModel } = this.state;
    if (!selectedModel){
      return <Loader active={true}/>
    }
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
    )
  }
}
