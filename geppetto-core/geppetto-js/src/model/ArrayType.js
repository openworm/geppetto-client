

/**
 * Client class use to represent an array type.
 *
 * @module model/ArrayType
 * @author Giovanni Idili
 * @author Matteo Cantarelli
 */

var Type = require('./Type').default;

function ArrayType (options) {
  Type.prototype.constructor.call(this, options);
  this.type = options.type;
  this.size = options.elements;
}

ArrayType.prototype = Object.create(Type.prototype);
ArrayType.prototype.constructor = ArrayType;

/**
 * Get type for array type
 *
 * @command ArrayType.getType()
 *
 * @returns {Type} - type
 *
 */
ArrayType.prototype.getType = function () {
  return this.type;
};

/**
 * Get array size
 *
 * @command ArrayType.getSize()
 *
 * @returns {int} - size of the array
 *
 */
ArrayType.prototype.getSize = function () {
  return this.size;
};

// Compatibility with new imports and old require syntax
ArrayType.default = ArrayType;
module.exports = ArrayType;