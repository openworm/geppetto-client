import auditoryCortex from './auditory_cortex.json';
import auditoryOutputMapping from './rawRecording_auditory/outputMapping.dat';
import auditoryResults0 from './rawRecording_auditory/results0.dat';
import auditoryResults1 from './rawRecording_auditory/results1.dat';
import auditoryResults2 from './rawRecording_auditory/results2.dat';
import auditoryResults3 from './rawRecording_auditory/results3.dat';
import auditoryResults4 from './rawRecording_auditory/results4.dat';
import auditoryResults5 from './rawRecording_auditory/results5.dat';

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

export default model;
