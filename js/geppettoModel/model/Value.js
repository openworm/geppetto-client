const ObjectWrapper = require('./ObjectWrapper');
const extend = require('../../common/Utils').extend;
/**
 * Client class use to represent a variable.
 *
 * @module model/Value
 */
class Value extends ObjectWrapper{


  constructor (options) {
    super(options);
    this.pointerValue = options.pointerValue;
    this.capabilities = [];
    extend(this, this.getObject(this.wrappedObj));
  }

  getObject (rawValue) {
    switch (rawValue.eClass) {
    case 'JSON':
      return JSON.parse(rawValue.json);
    case 'Metadata':
    case 'Composite':
      return this.getObjectForMetadata(rawValue.value);
    case 'StringToValueMap':
      return { [rawValue.key]:this.getObject(rawValue.value) }
    case 'TypeToValueMap':
      return { 'value': this.getObject(rawValue.value) }
    default:{
      let obj = { ...rawValue };
      
      if (obj.value && obj.value.eClass) {
        extend(obj, this.getObject(obj.value));
      }
      delete obj.eClass;
      return obj;
    }

    }

    // TODO handle other value types
  }


  getObjectForMetadata (rawValue) {
    let obj = {}
    for (let stringValueMap of rawValue) {
      if (!stringValueMap.value) {
        console.error('Malformed object value', stringValueMap);
        continue;
      }
      obj[stringValueMap.key] = this.getObject(stringValueMap.value);
    }
    return obj;
  }
  
}

// Compatibility with new imports and old require syntax
Value.default = Value;
module.exports = Value;
