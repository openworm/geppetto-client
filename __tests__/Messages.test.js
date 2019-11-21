
const GEPPETTO = {};
window.GEPPETTO = GEPPETTO;
require('../js/common/GEPPETTO.Resources').default(GEPPETTO);
require('../js/pages/geppetto/GEPPETTO.Events').default(GEPPETTO);
require('../js/communication/MessageHandler').default(GEPPETTO);
const Manager = require('../js/common/Manager').default;
const ModelFactory = require('../js/geppettoModel/ModelFactory').default(GEPPETTO);
const testModel = require('./resources/test_model.json');
const AA = require('../js/geppettoModel/model/ArrayElementInstance').default;

GEPPETTO.Utility = {};
GEPPETTO.Utility.extractMethodsFromObject = () => [];
GEPPETTO.trigger = evt => console.log(evt, 'triggered');
GEPPETTO.Manager = new Manager();
console.warn = () => null;
GEPPETTO.CommandController = {
  log: console.log,
  createTags: (a, b) => null
};

test('fetch instances', () => {
  GEPPETTO.Manager.loadModel(testModel);
  const instanceLength = Instances.length;
  const allPathsLength = ModelFactory.allPaths.length;

  testModel.worlds[0].instances.push({
    "eClass": "SimpleInstance",
    "position": {
      "eClass": "Point",
      "y": 1,
      "x": 1,
      "z": 1
    },
    "value": {
      "eClass": "JSON",
      "json": "{\"l\": [\"x\", \"y\"]}"
    },
    "type": {
      "eClass": "SimpleType",
      "$ref": "//@libraries.0/@types.1"
    },
    "id": "n",
    "name": "N"
  });

  const message = { type: 'fetched', data: JSON.stringify({ fetched: JSON.stringify(testModel) }) };

  GEPPETTO.MessageHandler.onMessage(message);

  expect(ModelFactory.allPaths.length).toBe(allPathsLength + 1);
  expect(Instances.length).toBe(instanceLength + 1);
  Instances.getInstance('n'); // Static instances are always instantiated
  expect(Model.n.getValue().l[0]).toBe('x');
});
