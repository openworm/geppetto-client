

/**
 * Client class use to represent a pointer.
 *
 * @module model/Pointer
 * @author Giovanni Idili
 */

  
var ObjectWrapper = require('./ObjectWrapper').default;

function Pointer (options) {
  ObjectWrapper.prototype.constructor.call(this, options);
  this.elements = (options.elements != undefined) ? options.elements : [];
}

Pointer.prototype = Object.create(ObjectWrapper.prototype);
Pointer.prototype.constructor = Pointer;


/**
 * Gets the full path for this pointer
 *
 * @command Pointer.getPath()
 *
 * @returns {String} - Path
 *
 */
Pointer.prototype.getPath = function (types) {
  if (types === undefined) {
    types = false;
  }

  var path = "";
  var elements = this.getElements();

  for (var e = 0; e < elements.length; e++) {
    var element = elements[e];

    path += element.getPath(types);

    if (e < elements.length - 1) {
      path += ".";
    }
  }

  return path;
};
    

/**
 * Get PointerElements
 *
 * @command POinter.getElements()
 *
 * @returns {List<PointerElement>} - array of elements
 */
Pointer.prototype.getElements = function () {
  return this.elements;
};
    
/**
 * Get the optional point attribute to refer to a point in space.
 *
 * @command Pointer.getPoint()
 *
 * @returns {Point} - 3d point
 */
Pointer.prototype.getPoint = function (){
  return this.getWrappedObj().point;
}
    

// Compatibility with new imports and old require syntax
Pointer.default = Pointer;
module.exports = Pointer;


