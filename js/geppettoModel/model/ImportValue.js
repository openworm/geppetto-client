

/**
 * Client class use to represent an array type.
 *
 * @module model/ImportValue
 * @author nitesh thali
 */

var Value = require('./Value').default;
    

function ImportValue (options) {
  Value.prototype.constructor.call(this, options);
}
    
ImportValue.prototype = Object.create(Value.prototype);
ImportValue.prototype.constructor = ImportValue;
    
ImportValue.prototype.resolve = function (callback) {
  GEPPETTO.Manager.resolveImportValue(this.getPath(), callback);
};
    
    
/**
 * Get path
 *
 * @command Type.getPath()
 *
 * @returns {String} - path
 *
 */
ImportValue.prototype.getPath = function () {
  if (this.parent) {
    return this.parent.getPath();
  } else {
    throw "A value should always have a parent!";
  }

};

// Compatibility with new imports and old require syntax
ImportValue.default = ImportValue;
module.exports = ImportValue;
