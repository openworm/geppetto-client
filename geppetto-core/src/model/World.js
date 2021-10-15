import ObjectWrapper from './ObjectWrapper';

export default class World extends ObjectWrapper{
  constructor (world, instances, variables) {
    super({ wrappedObj: world });
    this.instances = instances;
    this.variables = variables;
  }

  getInstances () {
    return this.instances;
  }

  getVariables () {
    return this.variables;
  }

  getChildren () {
    return this.instances.concat(this.variables);
  }

}