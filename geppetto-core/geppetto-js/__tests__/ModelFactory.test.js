const ModelFactory = require('../src/ModelFactory').default;

const testModel = require('./resources/test_model.json');
const AA = require('../src/model/ArrayElementInstance').default;


test('load test model with new instances', () => {
  const modelFactory = new ModelFactory();
  const model = modelFactory.createGeppettoModel(testModel, true, true);
  const instances = modelFactory.createInstances(model);

  expect(modelFactory.allPaths.length).toBe(11);

  expect(instances.length).toBe(7)
  expect(instances.a.getValue().l[0]).toBe('x');
  expect(instances.b.getValue().expression).toBe('exp');
  expect(instances.b.getPosition().y).toBe(50);
  expect(instances.c.getValue().x.y.data).toBe('imageData');
  expect(instances.d.getValue().a.text).toBe('Test');
  expect(instances.d.getValue().b.url).toBe("http://aaa.com");
  expect(instances.d.getValue().c.x).toBe(1);
  expect(instances.E.getValue().value.length).toBe(3);
  expect(instances.getInstance('v.ctv').getValue().value.text).toBe('aaa');
  expect(instances.a2b.a).toBe(instances.a);
  expect(instances.a2b.b).toBe(instances.b);
});

test('Merge models', () => {
  const modelFactory = new ModelFactory();
  const model = modelFactory.createGeppettoModel(testModel, true, true);
  const instances = modelFactory.createInstances(model);

  expect(modelFactory.allPaths.length).toBe(11);
  expect(instances.length).toBe(7);
  
  let diffReport = modelFactory.mergeModel(testModel);
  expect(diffReport.variables.length).toBe(0);

  modelFactory.createInstancesFromDiffReport(diffReport, instances);
  expect(modelFactory.allPaths.length).toBe(11);
  expect(instances.length).toBe(7);

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

  diffReport = modelFactory.mergeModel(testModel);
  
  expect(diffReport.variables.length).toBe(1);
  expect(modelFactory.allPaths.length).toBe(13);
  diffReport = modelFactory.mergeModel(testModel);
  modelFactory.createInstancesFromDiffReport(diffReport, instances);
  
  expect(instances.length).toBe(7);
  instances.getInstance('v2');
  expect(instances.length).toBe(8);


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

  diffReport = modelFactory.mergeModel(testModel);
  expect(diffReport.variables.length).toBe(0);
  expect(diffReport.worlds[0].variables.length).toBe(1);
  expect(diffReport.worlds[0].instances.length).toBe(0);
  expect(modelFactory.allPaths.length).toBe(15);
  expect(instances.length).toBe(8);
  instances.getInstance('wv2');
  expect(instances.length).toBe(9);


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

  diffReport = modelFactory.mergeModel(testModel);
  modelFactory.createInstancesFromDiffReport(diffReport, instances);
  expect(diffReport.variables.length).toBe(0);
  expect(diffReport.worlds[0].variables.length).toBe(0);
  expect(diffReport.worlds[0].instances.length).toBe(1);
  expect(modelFactory.allPaths.length).toBe(16);
  expect(instances.length).toBe(10);
  instances.getInstance('n'); // Static instances are always instantiated
  expect(instances.length).toBe(10);
});
