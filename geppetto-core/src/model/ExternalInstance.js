const Instance = require('./Instance').default;

/**
 * Client class use to represent an instance object (instantiation of a variable)
 * 
 * @module model/Instance
 * @author Giovanni Idili
 * @author Matteo Cantarelli
 */
class ExternalInstance extends Instance {

  constructor (options) {
    super(options);
    this.path = options.path;
    this.projectId = options.projectId;
    this.experimentId = options.experimentId;
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
    throw "Invalid operation with ExternalInstance";
  }

  getValues () {
    throw "Invalid operation with ExternalInstance";
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
    throw "Invalid operation with ExternalInstance";
  }

  getValue () {
    throw "Invalid operation with ExternalInstance";
  }

  /**
   *
   * @returns {*|Object}
   */
  getPosition () {
    throw "Invalid operation with ExternalInstance";
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
    return false;
  }

  /**
   * Gets visual types for the instance if any
   *
   * @command Instance.getVisualType()
   *
   * @returns {*} - Type or list of Types if more than one is found
   */
  getVisualType () {
    return undefined;
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
  getInstancePath () {
    return this.path;
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
    throw "Invalid operation with ExternalInstance";
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
    throw "Invalid operation with ExternalInstance";
  }

  /**
   * Get children instances
   *
   * @command Instance.addChild()
   */
  addChild (child) {
    throw "Invalid operation with ExternalInstance";
  }

  /**
   * Return connections, user GEPPETTO.Resources.INPUT / OUTPUT /
   * INPUT_OUTPUT to filter
   *
   * @command Instance.getConnections(direction)
   *
   * @returns {List<Instance>}
   *
   */
  getConnections (direction) {
    return this.connections;
  }

  /**
   * Deletes instance
   */
  delete () {
    throw "Invalid operation with ExternalInstance";
  }

 
}

// Compatibility with new imports and old require syntax
ExternalInstance.default = ExternalInstance;
module.exports = ExternalInstance;
