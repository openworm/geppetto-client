const extend = require('@geppettoengine/geppetto-core/common/Utils').extend;
var StoreManager = require('@geppettoengine/geppetto-client/common/StoreManager').default
/**
 * Client class use to represent an instance object (instantiation of a variable).
 *
 * @module model/Instance
 * @author Giovanni Idili
 * @author Matteo Cantarelli
 */

class Instance {

  constructor (options) {
    this.id = options.id;
    this.name = options.name;
    this._metaType = options._metaType;
    this.variable = options.variable;
    this.parent = options.parent;
    this.children = (options.children != undefined) ? options.children : [];
    this.capabilities = [];
    this.connections = [];
  }


  /**
   * Get id
   *
   * @command Instance.getId()
   *
   * @returns {String} - Id
   *
   */
  getId () {
    return this.id;
  }

  /**
   * Get name
   *
   * @command Instance.getName()
   *
   * @returns {String} - Name
   *
   */
  getName () {
    return this.name;
  }

  /**
   * Get meta type
   *
   * @command Instance.getMetaType()
   *
   * @returns {String} - meta type
   *
   */
  getMetaType () {
    return this._metaType;
  }

  /**
   * Get the type for this instance
   *
   * @command Instance.getTypes()
   *
   * @returns {List<Type>} - array of types
   *
   */
  getTypes () {
    return this.getVariable().getTypes();
  }
        
  getValues () {
    return this.getVariable().getValues();
  }
  /**
   * Get the type of this variable, return a list if it has more than one
   *
   * @command Variable.getType()
   *
   * @returns List<Type>} - array of types
   *
   */
  getType () {
    var types = this.variable.getTypes();
    if (types.length == 1) {
      return types[0];
    } else {
      return types;
    }
  }
        
  getValue () {
    return this.getVariable().getValue();
  }
  /**
   *
   * @returns {*|Object}
   */
  getPosition () {
    return this.getVariable().getPosition();
  }

  /**
   * Checks if this instance has a visual type
   *
   * @command Instance.hasVisualType()
   *
   * @returns {Boolean}
   *
   */
  hasVisualType () {
    var hasVisual = false;
    var types = this.getTypes();

    // check if any of types is VISUAL_TYPE_NODE or if types HAVE .visualType
    for (var i = 0; i < types.length; i++) {
      // could be pointing to an array variable if it's an exploded instance
      if (types[i].getMetaType() == GEPPETTO.Resources.ARRAY_TYPE_NODE) {
        // check it if is a visual type or has a visual type
        if (types[i].getType().getMetaType() == GEPPETTO.Resources.VISUAL_TYPE_NODE
                        || types[i].getType().getMetaType() == GEPPETTO.Resources.COMPOSITE_VISUAL_TYPE_NODE
                        || (types[i].getType().getVisualType() != null)) {
          hasVisual = true;
          break;
        }
      } else if (types[i].getMetaType() == GEPPETTO.Resources.VISUAL_TYPE_NODE
                    || types[i].getMetaType() == GEPPETTO.Resources.COMPOSITE_VISUAL_TYPE_NODE
                    || types[i].getVisualType() != null) {
        hasVisual = true;
        break;
      }
    }

    return hasVisual;
  }

  /**
   * Gets visual types for the instance if any
   *
   * @command Instance.getVisualType()
   *
   * @returns {*} - Type or list of Types if more than one is found
   */
  getVisualType () {
    var visualTypes = [];

    var types = this.getTypes();
    // check if any of types is VISUAL_TYPE_NODE or if types HAVE .visualType
    for (var i = 0; i < types.length; i++) {
      // could be pointing to an array variable if it's an exploded instance
      if (types[i].getMetaType() == GEPPETTO.Resources.ARRAY_TYPE_NODE) {
        // check it if is a visual type or has a visual type
        if (types[i].getType().getMetaType() == GEPPETTO.Resources.VISUAL_TYPE_NODE || types[i].getType().getMetaType() == GEPPETTO.Resources.COMPOSITE_VISUAL_TYPE_NODE) {
          visualTypes.push(types[i].getType());
        } else if (types[i].getType().getVisualType() != null) {
          visualTypes.push(types[i].getType().getVisualType());
        }
      } else {
        // check it if is a visual type or has a visual type
        if (types[i].getMetaType() == GEPPETTO.Resources.VISUAL_TYPE_NODE || types[i].getMetaType() == GEPPETTO.Resources.COMPOSITE_VISUAL_TYPE_NODE) {
          visualTypes.push(types[i]);
        } else if (types[i].getVisualType() != null) {
          visualTypes.push(types[i].getVisualType());
        }
      }
    }

    if (visualTypes.length == 0) {
      return undefined;
    } else if (visualTypes.length == 1) {
      return visualTypes[0];
    } else {
      return visualTypes;
    }
  }


  /**
   * Get the variable for this instance
   *
   * @command Instance.getVariable()
   *
   * @returns {Variable} - Variable object for this instance
   *
   */
  getVariable () {
    return this.variable;
  }

  /**
   * Get children instances
   *
   * @command Instance.getChildren()
   *
   * @returns {List<Instance>} - List of instances
   *
   */
  getChildren () {
    return this.children;
  }

  /**
   * Get instance path
   *
   * @command Instance.getInstancePath()
   *
   * @returns {String} - Instance path
   *
   */
  getInstancePath (useType) {
    if (useType == undefined){
      useType = false;
    }

    var parent = this.parent;
    var parentPath = "";

    if (parent != null && parent != undefined) {
      parentPath = parent.getInstancePath(useType);
    }
    var path = parentPath + "." + this.getId();

    if (useType){
      path += "(" + this.getType().getId() + ")";
    }

    return (parentPath != "") ? path : path.replace('.','');
  }

  /**
   * Synonym of get instance path
   *
   * @command Instance.getPath()
   *
   * @returns {String} - Instance path
   *
   */
  getPath () {
    return this.getInstancePath();
  }

  /**
   * Get raw instance path (without array shortening)
   *
   * @command Instance.getRawInstancePath()
   *
   * @returns {String} - Instance path
   *
   */
  getRawInstancePath () {
    var parent = this.parent;
    var parentPath = "";

    if (parent != null && parent != undefined) {
      parentPath = parent.getInstancePath();
    }

    return (parentPath != "") ? (parentPath + "." + this.getId()) : this.getId();
  }


  /**
   * Get parent
   *
   * @command Instance.getParent()
   *
   * @returns {Instance} - Parent instance
   *
   */
  getParent () {
    return this.parent;
  }

  /**
   * Get children instances
   *
   * @command Instance.addChild()
   */
  addChild (child) {
    this.children.push(child);
  }

  /**
   * Extends with methods from another object
   *
   * @command Instance.extendApi(extensionObj)
   */
  extendApi (extensionObj) {
    extend(this, extensionObj);
    this.capabilities.push(extensionObj.capabilityId);
  }

  /**
   * Checks if the instance has a given capability
   *
   * @command Instance.hasCapability(capabilityId)
   *
   * @returns {Boolean}
   */
  hasCapability (capabilityId) {
    var hasCapability = false;
    var capabilities = this.capabilities;

    for (var i = 0; i < capabilities.length; i++) {
      if (capabilities[i] === capabilityId) {
        hasCapability = true;
      }
    }

    return hasCapability;
  }

  /**
   * Get instance capabilities
   *
   * @returns {Array}
   */
  getCapabilities () {
    return this.capabilities;
  }

  /**
   * Return connections, user GEPPETTO.Resources.INPUT / OUTPUT / INPUT_OUTPUT to filter
   *
   * @command Instance.getConnections(direction)
   *
   * @returns {List<Instance>}
   *
   */
  getConnections (direction) {
    StoreManager.actionsHandler[StoreManager.clientActions.SPIN_LOGO]();
    GEPPETTO.ModelFactory.updateConnectionInstances(this);

    var connections = this.connections;

    if (direction === GEPPETTO.Resources.INPUT || direction === GEPPETTO.Resources.OUTPUT || direction === GEPPETTO.Resources.INPUT_OUTPUT) {
      var filteredConnections = [];
      for (var i = 0; i < connections.length; i++) {
        // get directionality
        var connectivity = connections[i].getVariable().getInitialValue().value.connectivity;
        if (connectivity == GEPPETTO.Resources.DIRECTIONAL) {
          var a = connections[i].getA();
          var b = connections[i].getB();
          // if A is this then it's an output connection
          if (this.getInstancePath() == a.getPath() && direction === GEPPETTO.Resources.OUTPUT) {
            filteredConnections.push(connections[i]);
          }
          // if B is this then it's an input connection
          if (this.getInstancePath() == b.getPath() && direction === GEPPETTO.Resources.INPUT) {
            filteredConnections.push(connections[i]);
          }
        } else if (connectivity == GEPPETTO.Resources.BIDIRECTIONAL) {
          filteredConnections.push(connections[i]);
        }
      }

      // set return variable to filtered list
      connections = filteredConnections;
    }

    StoreManager.actionsHandler[StoreManager.clientActions.STOP_LOGO]();
    return connections;
  }

  /**
   * Get children instances
   *
   * @command Instance.addConnection()
   */
  addConnection (connection) {
    this.connections.push(connection);
  }

  /**
   * Deletes instance
   */
  delete () {
    var children = [].concat(this.getChildren());
    for (var c = 0; c < children.length; c++) {
      children[c].delete();
    }

    GEPPETTO.ModelFactory.deleteInstance(this);
  }

}

// Compatibility with new imports and old require syntax
Instance.default = Instance;
module.exports = Instance;
