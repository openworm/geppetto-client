import ObjectWrapper from './ObjectWrapper';
import { extend } from '../../common/Utils';

export default class ASimpleInstance extends ObjectWrapper{
 
  constructor (node) {
    super({ wrappedObj: node });

    // Value and type can be wrapped so let's keep separate from the visual value
    this.value = node.value;
    this.type = node.type;
    this.capabilities = [];
    this.connections = [];
  }

  getTypes () {
    return [this.getType()];
  }
        
  getValues () {
    return [this.getValue()];
  }
  
  getType () {
    return this.type;
  }
        
  getValue () {
    return this.value;
  }
  
  getVisualValue () {
    return this.wrappedObj.visualValue;
  }

  hasVisualValue () {
    return this.wrappedObj.visualValue;
  }

  getPosition () {
    return this.wrappedObj.position;
  }

  hasVisualType () {
    throw "Simple instances don't support visual type: use hasVisualValue instead";
  }

  getVisualType () {
    throw "Simple instances don't support visual type: use getVisualValue instead";
  }

  getVariable () {
    throw "Simple instances don't support variables";
  }

  getChildren () {
    return [];
  }

  getInstancePath () {
    return this.wrappedObj.id;
  }

  getPath () {
    return this.getInstancePath();
  }

  getRawInstancePath () {
    return this.getInstancePath();
  }

  getParent () {
    return null;
  }

  addChild () {
    throw "Simple instances don't have children";
  }

  extendApi (extensionObj) {
    extend(this, extensionObj);
    this.capabilities.push(extensionObj.capabilityId);
  }

  hasCapability (capabilityId) {
    return this.capabilities.findIndex(capability => capability === capabilityId) != -1;
  }

  getCapabilities () {
    return this.capabilities;
  }

  getConnections (direction) {
    console.error('getConnections is not yet implemented for simple instances');
    return this.connections;
  }

  addConnection (connection) {
    this.connections.push(connection);
  }
}

