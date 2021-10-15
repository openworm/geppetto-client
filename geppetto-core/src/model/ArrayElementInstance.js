const Instance = require('./Instance').default;

/**
 * Client class use to represent an array element instance.
 *
 * @module model/ArrayElementInstance
 * @author Giovanni Idili
 */
class ArrayElementInstance extends Instance {
  
  constructor (options) {
    super(options);
    this.index = options.index;
  }


  getIndex () {
    return this.index;
  }

  delete () {
    var children = [].concat(this.getChildren());
    for (var c = 0; c < children.length; c++) {
      children[c].delete();
    }

    GEPPETTO.ModelFactory.deleteInstance(this);
  }


  getInstancePath () {
    var parent = this.getParent();
    var parentPath = "";
    var parentId = "";

    if (parent != null && parent != undefined) {
      parentPath = parent.getInstancePath();
      parentId = parent.getId();
    }

    var path = parentPath.replace(parentId, this.getId());

    return (parentPath != "") ? path : this.getId();
  }

  getPosition () {

    if ((this.getVariable().getType().getDefaultValue().elements != undefined)
            && (this.getVariable().getType().getDefaultValue().elements[this.getIndex()] != undefined)) {
      return this.getVariable().getType().getDefaultValue().elements[this.getIndex()].position;
    }

  }

  getTypes () {
    return [this.getVariable().getType().getType()];
  }

  getType () {
    var types = this.getTypes();
    if (types.length == 1) {
      return types[0];
    } else {
      return types;
    }
  }

}

ArrayElementInstance.default = ArrayElementInstance;
module.exports = ArrayElementInstance;
