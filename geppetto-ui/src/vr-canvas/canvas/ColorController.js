export default class ColorController {
  constructor(meshFactory) {
    this.meshFactory = meshFactory;
  }

  /**
   * Modulates the color of an instance given a color function.
   * The color function should receive the value of the watched node and output [r,g,b].
   *
   * @param {Instance} instance - The instance to be lit
   * @param {Instance} modulation - Variable which modulates the color
   * @param {Function} colorfn - Converts time-series value to [r,g,b]
   */
  addColorFunction(instances) {
    const compositeToLit = {};
    const visualObjectsToLit = {};
    let currentCompositePath;

    for (let j = 0; j < instances.length; j++) {
      let composite;
      let multicompartment = false;

      composite = instances[j].getParent();

      while (
        composite.getMetaType() !=
        GEPPETTO.Resources.ARRAY_ELEMENT_INSTANCE_NODE
      ) {
        if (composite.getParent() == null) {
          // eslint-disable-next-line no-throw-literal
          throw 'Unsupported model to use this function';
        } else {
          composite = composite.getParent();
          multicompartment = true;
        }
      }

      currentCompositePath = composite.getInstancePath();
      if (
        !Object.prototype.hasOwnProperty.call(
          compositeToLit,
          currentCompositePath
        )
      ) {
        compositeToLit[currentCompositePath] = composite;
        visualObjectsToLit[currentCompositePath] = [];
      }

      if (multicompartment) {
        for (let k = 0; k < composite.getChildren().length; ++k) {
          const id = composite.getChildren()[k].getId();
          if (visualObjectsToLit[currentCompositePath].indexOf(id) < 0) {
            visualObjectsToLit[currentCompositePath].push(id);
          }
        }
      }
    }

    for (const l in Object.keys(compositeToLit)) {
      const path = Object.keys(compositeToLit)[l];
      this.addColorFunctionBulk(compositeToLit[path], visualObjectsToLit[path]);
    }
  }

  /**
   * Modulates the color of an aspect visualization, given a watched node
   * and a color function. The color function should receive
   * the value of the watched node and output [r,g,b].
   *
   * @param {Instance} instance - The instance to be lit
   * @param {Instance} modulation - Variable which modulates the color
   * @param {Function} colorfn - Converts time-series value to [r,g,b]
   */
  addColorFunctionBulk(instance, visualObjects) {
    if (visualObjects != null) {
      if (visualObjects.length > 0) {
        const elements = {};
        for (const voIndex in visualObjects) {
          elements[visualObjects[voIndex]] = '';
        }
        this.meshFactory.splitGroups(instance, elements);
      }
    }
  }

  /**
   * Light up the entity
   *
   * @param {Instance}
   *            instance - the instance to be lit
   * @param {Float}
   *            intensity - the lighting intensity from 0 (no illumination) to 1 (full illumination)
   */
  colorInstance(instance, colorfn, intensity) {
    let threeObject;
    if (
      instance in this.meshFactory.meshes &&
      this.meshFactory.meshes[instance].visible
    ) {
      threeObject = this.meshFactory.meshes[instance];
    } else {
      threeObject = this.meshFactory.splitMeshes[instance];
    }

    const [r, g, b] = colorfn(intensity);
    if (threeObject != undefined) {
      threeObject.material.color.setRGB(r, g, b);
    }
  }
}
