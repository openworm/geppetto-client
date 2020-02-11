export default class Instances extends Array {

    constructor(geppettoModel, modelFactory, instanceDeletedCallback) {
        super();
        this.modelFactory = modelFactory;
        this.geppettoModel = geppettoModel;
        let instances;

        // Initialize instances with static instances already present in the model
        if (geppettoModel.getCurrentWorld()) {
        instances = geppettoModel.getCurrentWorld().getInstances().concat(modelFactory.instantiateVariables(geppettoModel));
        } else {
        instances = modelFactory.instantiateVariables(geppettoModel);
        }
        
        this.addInstances(instances);
        this.instanceDeletedCallback = instanceDeletedCallback ? instanceDeletedCallback : () => undefined;
        // create global shortcuts to top level instances
        for (var i = 0; i < instances.length; i++) {
            this[instances[i].getId()] = instances[i];
        }
    }

    addInstances(instances) {
        instances.forEach(instance => this.modelFactory.updateConnectionInstances(instance));
        this.push.apply(this, instances);
    }

    // add method to add instances to window.Instances
    addInstancesFromPaths(instancePaths) {
        if (!(instancePaths.constructor === Array)) {
            // if it's not an array throw it into an array with a single element
            instancePaths = [instancePaths];
        }

        this.modelFactory.addInstances(instancePaths, this, this.geppettoModel);
    };



    getInstance(instancePath, create, override) {
        if (create == undefined) {
          create = true;
        }
  
        var instances = [];
        var InstanceVarName = "this.";
        var arrayParameter = true;
  
        if (!(instancePath.constructor === Array)) {
          instancePath = [instancePath];
          arrayParameter = false;
        }
  
        // check if we have any [*] for array notation and replace with exploded paths
        for (var j = 0; j < instancePath.length; j++) {
          if (instancePath[j].indexOf('[*]') > -1) {
            var arrayPath = instancePath[j].substring(0, instancePath[j].indexOf('['));
            var subArrayPath = instancePath[j].substring(instancePath[j].indexOf(']') + 1, instancePath[j].length);
            var arrayInstance = this.getInstance(arrayPath);
            var arraySize = arrayInstance.getSize();
  
            // remove original * entry
            instancePath.splice(j, 1);
            // add exploded elements
            for (var x = 0; x < arraySize; x++) {
              instancePath.push(arrayPath + '[' + x + ']' + subArrayPath);
            }
          }
        }
  
  
        for (var i = 0; i < instancePath.length; i++) {
          try {
            var potentialVar = eval(InstanceVarName + instancePath[i]);
            if (potentialVar != undefined) {
              if (override) {
                this.deleteInstance(instances[i]);
                this.addInstancesFromPaths(instancePath[i]);
                instances.push(eval(InstanceVarName + instancePath[i]));
              } else {
                instances.push(potentialVar);
              }
            } else {
              if (create) {
                this.addInstancesFromPaths(instancePath[i]);
                instances.push(eval(InstanceVarName + instancePath[i]));
              }
            }
          } catch (e) {
            if (create) {
              try {
  
                this.addInstancesFromPaths(instancePath[i]);
                instances[i] = eval(InstanceVarName + instancePath[i]);
              } catch (e) {
                  throw e;
                throw ("The instance " + instancePath[i] + " does not exist in the current model");
              }
            }
          }
        }
        instances.forEach(instance => {if(instance) this.modelFactory.updateConnectionInstances(instance)});
        if (instances.length == 1 && !arrayParameter) {
          // if we received an array we want to return an array even if there's only one element
          return instances[0];
        } else {
          return instances;
        }
      };
    

    /**
   * Build instance hierarchy
   */
    buildInstanceHierarchy(path, parentInstance, model, topLevelInstances) {
        var variable = null;
        var newlyCreatedInstance = null;
        var newlyCreatedInstances = [];

        // STEP 1: find matching first variable in path in the model object passed in
        var varsIds = path.split('.');
        // check model MetaType and find variable accordingly
        if (model.getMetaType() == Resources.GEPPETTO_MODEL_NODE) {
            var variables = model.getAllVariables();
            for (var i = 0; i < variables.length; i++) {
                if (varsIds[0] === variables[i].getId()) {
                    variable = variables[i];
                    break;
                }
            }
        } else if (model.getMetaType() == Resources.VARIABLE_NODE) {
            var allTypes = model.getTypes();

            // if array, and the array type
            if (allTypes.length == 1 && allTypes[0].getMetaType() == Resources.ARRAY_TYPE_NODE) {
                allTypes.push(model.getTypes()[0].getType());
            }

            // get all variables and match it from there
            for (var i = 0; i < allTypes.length; i++) {
                if (allTypes[i].getMetaType() == Resources.COMPOSITE_TYPE_NODE) {
                    var variables = allTypes[i].getVariables();

                    for (var m = 0; m < variables.length; m++) {
                        if (varsIds[0] === variables[m].getId()) {
                            variable = variables[m];
                            break;
                        }
                    }

                    // break outer loop too
                    if (variable != null) {
                        break;
                    }
                }
            }

            // check if parent is an array - if so we know the variable cannot exist so set the same variable as the array
            if (variable == null && parentInstance.getMetaType() == Resources.ARRAY_INSTANCE_NODE) {
                // the variable associated to an array element is still the array variable
                variable = model;
            }
        }

        // STEP 2: create instance for given variable
        if (variable != null) {

            var types = variable.getTypes();
            var arrayType = null;
            for (var j = 0; j < types.length; j++) {
                if (types[j].getMetaType() == Resources.ARRAY_TYPE_NODE) {
                    arrayType = types[j];
                    break;
                }
            }

            // check in top level instances if we have an instance for the current variable already
            var instancePath = (parentInstance != null) ? (parentInstance.getInstancePath() + '.' + varsIds[0]) : varsIds[0];
            var matchingInstance = this.findMatchingInstance(instancePath, topLevelInstances);

            if (matchingInstance != null) {
                // there is a match, simply re-use that instance as the "newly created one" instead of creating a new one
                newlyCreatedInstance = matchingInstance;
            } else if (arrayType != null) {
                // when array type, explode into multiple ('size') instances
                var size = arrayType.getSize();

                // create new ArrayInstance object, add children to it
                var arrayOptions = {
                    id: variable.getId(),
                    name: variable.getName(),
                    _metaType: Resources.ARRAY_INSTANCE_NODE,
                    variable: variable,
                    size: size,
                    parent: parentInstance
                };
                var arrayInstance = this.createArrayInstance(arrayOptions);


                for (var i = 0; i < size; i++) {
                    // create simple instance for this variable
                    var options = {
                        id: variable.getId() + '[' + i + ']',
                        name: variable.getName() + '[' + i + ']',
                        _metaType: Resources.ARRAY_ELEMENT_INSTANCE_NODE,
                        variable: variable,
                        children: [],
                        parent: arrayInstance,
                        index: i
                    };
                    var explodedInstance = this.createArrayElementInstance(options);

                    // check if visual type and inject AVisualCapability
                    var visualType = explodedInstance.getVisualType();
                    if ((!(visualType instanceof Array) && visualType != null && visualType != undefined)
                        || (visualType instanceof Array && visualType.length > 0)) {
                        explodedInstance.extendApi(AVisualCapability);
                        this.propagateCapabilityToParents(AVisualCapability, explodedInstance);

                        if (visualType instanceof Array && visualType.length > 1) {
                            throw ("Support for more than one visual type is not implemented.");
                        }

                        // check if it has visual groups - if so add visual group capability
                        if ((typeof visualType.getVisualGroups === "function")
                            && visualType.getVisualGroups() != null
                            && visualType.getVisualGroups().length > 0) {
                            explodedInstance.extendApi(AVisualGroupCapability);
                            explodedInstance.setVisualGroups(visualType.getVisualGroups());
                        }
                    }

                    // check if it has connections and inject AConnectionCapability
                    if (explodedInstance.getType().getMetaType() == Resources.CONNECTION_TYPE) {
                        explodedInstance.extendApi(AConnectionCapability);
                        this.resolveConnectionValues(explodedInstance);
                    }

                    if (explodedInstance.getType().getMetaType() == Resources.STATE_VARIABLE_TYPE) {
                        explodedInstance.extendApi(AStateVariableCapability);
                    }

                    if (explodedInstance.getType().getMetaType() == Resources.DERIVED_STATE_VARIABLE_TYPE) {
                        explodedInstance.extendApi(ADerivedStateVariableCapability);
                    }

                    if (explodedInstance.getType().getMetaType() == Resources.PARAMETER_TYPE) {
                        explodedInstance.extendApi(AParameterCapability);
                    }

                    // add to array instance (adding this way because we want to access as an array)
                    arrayInstance[i] = explodedInstance;

                    // ad to newly created instances list
                    newlyCreatedthis.push(explodedInstance);

                    if (explodedInstance != null || undefined) {
                        this.newObjectCreated(explodedInstance);
                    }
                }

                //  if there is a parent add to children else add to top level instances
                if (parentInstance != null && parentInstance != undefined) {
                    parentInstance.addChild(arrayInstance);
                } else {
                    // NOTE: not sure if this can ever happen (top level instance == array)
                    topLevelthis.push(arrayInstance);
                }

            } else if (!variable.isStatic()) {
                // NOTE: only create instances if variable is NOT static

                // create simple instance for this variable
                var options = {
                    id: variable.getId(),
                    name: variable.getName(),
                    _metaType: Resources.INSTANCE_NODE,
                    variable: variable,
                    children: [],
                    parent: parentInstance
                };
                newlyCreatedInstance = this.createInstance(options);

                // check if visual type and inject AVisualCapability
                var visualType = newlyCreatedInstance.getVisualType();
                // check if visual type and inject AVisualCapability
                if ((!(visualType instanceof Array) && visualType != null && visualType != undefined)
                    || (visualType instanceof Array && visualType.length > 0)) {
                    newlyCreatedInstance.extendApi(AVisualCapability);
                    // particles can move, we store its state in the time series coming from the statevariablecapability
                    if (visualType.getId() == Resources.PARTICLES_TYPE) {
                        newlyCreatedInstance.extendApi(AParticlesCapability);
                    }
                    this.propagateCapabilityToParents(AVisualCapability, newlyCreatedInstance);

                    if (visualType instanceof Array && visualType.length > 1) {
                        throw ("Support for more than one visual type is not implemented.");
                    }

                    // check if it has visual groups - if so add visual group capability
                    if ((typeof visualType.getVisualGroups === "function")
                        && visualType.getVisualGroups() != null
                        && visualType.getVisualGroups().length > 0) {
                        newlyCreatedInstance.extendApi(AVisualGroupCapability);
                        newlyCreatedInstance.setVisualGroups(visualType.getVisualGroups());
                    }

                }

                // check if it has connections and inject AConnectionCapability
                if (newlyCreatedInstance.getType().getMetaType() == Resources.CONNECTION_TYPE) {
                    newlyCreatedInstance.extendApi(AConnectionCapability);
                    this.resolveConnectionValues(newlyCreatedInstance);
                }

                if (newlyCreatedInstance.getType().getMetaType() == Resources.STATE_VARIABLE_TYPE) {
                    newlyCreatedInstance.extendApi(AStateVariableCapability);
                }

                if (newlyCreatedInstance.getType().getMetaType() == Resources.DERIVED_STATE_VARIABLE_TYPE) {
                    newlyCreatedInstance.extendApi(ADerivedStateVariableCapability);
                }

                if (newlyCreatedInstance.getType().getMetaType() == Resources.PARAMETER_TYPE) {
                    newlyCreatedInstance.extendApi(AParameterCapability);
                }

                //  if there is a parent add to children else add to top level instances
                if (parentInstance != null && parentInstance != undefined) {
                    parentInstance.addChild(newlyCreatedInstance);
                } else {
                    topLevelthis.push(newlyCreatedInstance);
                }

                if (newlyCreatedInstance != null || undefined) {
                    this.newObjectCreated(newlyCreatedInstance);
                }
            }
        }

        // STEP: 3 recurse rest of path (without first / leftmost var)
        var newPath = '';
        for (var i = 0; i < varsIds.length; i++) {
            if (i != 0) {
                newPath += (i < (varsIds.length - 1)) ? (varsIds[i] + '.') : varsIds[i];
            }
        }

        // if there is a parent instance - recurse with new parameters
        if (newlyCreatedInstance != null && newPath != '') {
            this.buildInstanceHierarchy(newPath, newlyCreatedInstance, variable, topLevelInstances);
        }

        // if there is a list of exploded instances recurse on each
        if (newlyCreatedthis.length > 0 && newPath != '') {
            for (var x = 0; x < newlyCreatedthis.length; x++) {
                this.buildInstanceHierarchy(newPath, newlyCreatedInstances[x], variable, topLevelInstances);
            }
        }
    }
    /**
   * Delete instance, also removing types and variables
   *
   * @param instance
   */
    deleteInstance(instance) {
        var instancePath = instance.getPath();
        var removeMatchingInstanceFromArray = function (instanceArray, instance) {
            var index = null;
            for (var i = 0; i < instanceArray.length; i++) {
                if (instanceArray[i].getPath() == instance.getPath()) {
                    index = i;
                    break;
                }
            }

            if (index != null) {
                instanceArray.splice(index, 1);
            }
        };

        // delete instance
        var parent = instance.getParent();
        if (parent == undefined) {
            /*
             * parent is window
             * remove from array of children
             */
            removeMatchingInstanceFromArray(window.Instances, instance);
            // remove reference
            delete window[instance.getId()];
        } else {
            // remove from array of children
            removeMatchingInstanceFromArray(parent.getChildren(), instance);
            // remove reference
            delete parent[instance.getId()];
        }

        // unresolve type
        for (var j = 0; j < instance.getTypes().length; j++) {
            this.unresolveType(instance.getTypes()[j]);
        }

        // re-run model shortcuts
        this.populateChildrenShortcuts(this.geppettoModel);

        this.instanceDeleted(instancePath);
    }

    instanceDeleted(instancePath) {
        this.instanceDeletedCallback(instancePath);
    }
}