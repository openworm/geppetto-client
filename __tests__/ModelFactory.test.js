
const GEPPETTO = {};
window.GEPPETTO = GEPPETTO;
require('../js/common/GEPPETTO.Resources').default(GEPPETTO);
require('../js/pages/geppetto/GEPPETTO.Events').default(GEPPETTO);
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

test('load test model with new instances', () => {
  GEPPETTO.Manager.loadModel(testModel);

  expect(ModelFactory.allPaths.length).toBe(11);
  expect(Instances.length).toBe(7)
  expect(Instances.a.getValue().l[0]).toBe('x');
  expect(Instances.b.getValue().expression).toBe('exp');
  expect(Instances.b.getPosition().y).toBe(50);
  expect(Instances.c.getValue().x.y.data).toBe('imageData');
  expect(Instances.d.getValue().a.text).toBe('Test');
  expect(Instances.d.getValue().b.url).toBe("http://aaa.com");
  expect(Instances.d.getValue().c.x).toBe(1);
  expect(Instances.E.getValue().value.length).toBe(3);
  expect(Instances.getInstance('v.ctv').getValue().value.text).toBe('aaa');
  expect(Instances.a2b.a).toBe(Instances.a);
  expect(Instances.a2b.b).toBe(Instances.b);
  ModelFactory.allPaths = [];
  ModelFactory.allPathsIndexing = [];
  Instances = [];
});

test('Merge models', () => {
  GEPPETTO.Manager.loadModel(testModel);

  expect(ModelFactory.allPaths.length).toBe(11);
  expect(Instances.length).toBe(7);
  
  let diffReport = GEPPETTO.ModelFactory.mergeModel(testModel);
  expect(diffReport.variables.length).toBe(0);

  GEPPETTO.Manager.addVariableToModel(testModel);
  expect(ModelFactory.allPaths.length).toBe(11);
  expect(Instances.length).toBe(7);

  testModel.variables.push({
    "eClass": "Variable",
    "types": [
      {
        "eClass": "CompositeType",
        "$ref": "//@libraries.0/@types.2"
      }
    ],
    "name": "V2",
    "id": "v2"
  });

  diffReport = GEPPETTO.ModelFactory.mergeModel(testModel);
  expect(diffReport.variables.length).toBe(1);
  expect(ModelFactory.allPaths.length).toBe(13);
  GEPPETTO.Manager.addVariableToModel(testModel);
  
  expect(Instances.length).toBe(7);
  Instances.getInstance('v2');
  expect(Instances.length).toBe(8);


  testModel.worlds[0].variables.push({
    "eClass": "Variable",
    "types": [
      {
        "eClass": "CompositeType",
        "$ref": "//@libraries.0/@types.2"
      }
    ],
    "name": "WV2",
    "id": "wv2"
  });

  diffReport = GEPPETTO.ModelFactory.mergeModel(testModel);
  expect(diffReport.variables.length).toBe(0);
  expect(diffReport.worlds[0].variables.length).toBe(1);
  expect(diffReport.worlds[0].instances.length).toBe(0);
  expect(ModelFactory.allPaths.length).toBe(15);
  expect(Instances.length).toBe(8);
  Instances.getInstance('wv2');
  expect(Instances.length).toBe(9);


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

  diffReport = GEPPETTO.ModelFactory.mergeModel(testModel);
  expect(diffReport.variables.length).toBe(0);
  expect(diffReport.worlds[0].variables.length).toBe(0);
  expect(diffReport.worlds[0].instances.length).toBe(1);
  expect(ModelFactory.allPaths.length).toBe(16);
  expect(Instances.length).toBe(10);
  Instances.getInstance('n'); // Static instances are always instantiated
  expect(Instances.length).toBe(10);
});
