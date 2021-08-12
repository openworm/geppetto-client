
const GEPPETTO = {};
window.GEPPETTO = GEPPETTO;
GEPPETTO.Resources = require('@geppettoengine/geppetto-core/Resources').default;
require('@geppettoengine/geppetto-client/pages/geppetto/GEPPETTO.Events').default(GEPPETTO);
const Manager = require('@geppettoengine/geppetto-client/common/Manager').default;
const ModelFactory = require('@geppettoengine/geppetto-core/ModelFactory').default(GEPPETTO);
const testModel = require('./resources/mg.json');
const mergeModel1 = require('./resources/mg1.json');
const mergeModel2 = require('./resources/mg2.json');
const AA = require('@geppettoengine/geppetto-core/model/ArrayElementInstance').default;
const EventManager = require('@geppettoengine/geppetto-client/common/EventManager').default;

EventManager.setStore({ dispatch: m => null })

GEPPETTO.ModelFactory = ModelFactory;
GEPPETTO.Utility = {};
GEPPETTO.Utility.extractMethodsFromObject = () => [];
GEPPETTO.trigger = evt => console.log(evt, 'triggered');
GEPPETTO.Manager = new Manager();
console.warn = () => null;
GEPPETTO.CommandController = {
  log: console.log,
  createTags: (a, b) => null
};



test('Merge models', () => {
  const geppettoModel = GEPPETTO.Manager.loadModel(testModel);

  expect(ModelFactory.allPaths.length).toBe(32);
  let diffReport = GEPPETTO.ModelFactory.mergeModel(require('./resources/mg1.json'));
  
  

  diffReport = GEPPETTO.ModelFactory.mergeModel(require('./resources/mg2.json'));

  diffReport = GEPPETTO.ModelFactory.mergeModel(require('./resources/mg3.json'));

  expect(ModelFactory.allPaths.length).toBe(287);
  const UBERON_0000966 =  window.Model.worlds[0].instances[278];
  expect(UBERON_0000966.getId()).toBe('UBERON_0000966');
  const conn = Instances.getInstance('PART_OF_MG_C_220_MAGN_RETI_UBERON_0000966');

  // expect(conn.b.getId()).toBe('UBERON_0000966');
});
