

/**
 * Client class use to represent top level Geppetto model.
 *
 * @module model/GeppettoModel
 * @author Giovanni Idili
 */

var ObjectWrapper = require('./ObjectWrapper').default;


function GeppettoModel (options) {
  ObjectWrapper.prototype.constructor.call(this, options);
  this.variables = (options.variables != undefined) ? options.variables : [];
  this.libraries = (options.libraries != undefined) ? options.libraries : [];
  this.datasources = (options.datasources != undefined) ? options.datasources : [];
  this.queries = (options.queries != undefined) ? options.queries : [];
  this.worlds = options.worlds != undefined ? options.worlds : [];
  this.currentWorldIdx = this.wrappedObj.worlds && this.wrappedObj.worlds.length ? 0 : -1;
}

GeppettoModel.prototype = Object.create(ObjectWrapper.prototype);
GeppettoModel.prototype.constructor = GeppettoModel;

/**
 * Get variables
 *
 * @command GeppettoModel.getVariables()
 *
 * @returns {List<Variable>} - List of Variable objects
 *
 */
GeppettoModel.prototype.getVariables = function (legacy) {
  if (this.currentWorldIdx >= 0 && !legacy) {
    return this.getCurrentWorld().getVariables();
  }
  return this.variables;
};

GeppettoModel.prototype.addToVariables = function (variablesToAdd) {
  let variables = this.getVariables();
  variables.push.apply(variables, variablesToAdd);
};

GeppettoModel.prototype.setVariables = function (variables) {
  if (this.currentWorldIdx >= 0) {
    this.getCurrentWorld().setVariables(variables);
  } else {
    this.variables = variables;
  }
};

GeppettoModel.prototype.getAllVariables = function () {
  if (this.currentWorldIdx >= 0) {
    return this.getCurrentWorld().getVariables().concat(this.variables);
  }
  return this.variables;
};

    
/**
 * Get the id
 *
 * @command GeppettoModel.getId()
 *
 * @returns {String} - The id of the model, a constant
 *
 */
GeppettoModel.prototype.getId = function () {
  return GEPPETTO.Resources.MODEL_PREFIX_CLIENT;
};

/**
 * Get libraries
 *
 * @command GeppettoModel.getLibraries()
 *
 * @returns {List<Library>} - List of library objects
 *
 */
GeppettoModel.prototype.getLibraries = function () {
  return this.libraries;
};

/**
 * Get datasources
 *
 * @command GeppettoModel.getDatasources()
 *
 * @returns {List<Datasource>} - List of datasource objects
 *
 */
GeppettoModel.prototype.getDatasources = function () {
  return this.datasources;
};

/**
 * Get top level queries
 *
 * @command GeppettoModel.getQueries()
 *
 * @returns {List<Query>} - List of query objects
 *
 */
GeppettoModel.prototype.getQueries = function () {
  return this.queries;
};

/**
 * Get combined list of all children
 *
 * @command GeppettoModel.getChildren()
 *
 * @returns {List<Object>} - List of children
 *
 */
GeppettoModel.prototype.getChildren = function () {
  return this.variables.concat(this.libraries, this.datasources, this.queries, this.worlds);
};


/**
 * Get the default selected world
 *
 */
GeppettoModel.prototype.getCurrentWorld = function () {
  return this.worlds[this.currentWorldIdx];
};

/**
 * Get worlds
 *
 */
GeppettoModel.prototype.getWorlds = function () {
  return this.worlds;
};

/**
 * Set the default selected world
 *
 */
GeppettoModel.prototype.activateWorld = function (worldOrIndex) {
  if (typeof worldOrIndex == 'number') {
    this.currentWorldIdx = worldOrIndex;
  } else if (typeof worldOrIndex == 'string'){
    this.currentWorldIdx = this.worlds.findIndex(world => world.id == worldOrIndex);
  }
  this.currentWorldIdx = this.worlds.findIndex(world => world.id == worldOrIndex.id);
  if (this.worlds[this.currentWorldIdx] === undefined) {
    console.error(worldOrIndex, "world not found in model");
    throw "World not found in model";
  }
};

// Compatibility with new imports and old require syntax
GeppettoModel.default = GeppettoModel;
module.exports = GeppettoModel;
