import * as THREE from 'three';
import MeshFactory from './MeshFactory';
import CameraManager from './CameraManager';
import { EffectComposer, RenderPass } from 'postprocessing';
import Instance from '@geppettoengine/geppetto-core/model/Instance';
import ArrayInstance from '@geppettoengine/geppetto-core//model/ArrayInstance';
import Type from '@geppettoengine/geppetto-core/model/Type';
import Variable from '@geppettoengine/geppetto-core/model/Variable';
require('./TrackballControls');

export default class ThreeDEngine {
  constructor(
    containerRef,
    cameraOptions,
    cameraHandler,
    selectionHandler,
    backgroundColor,
    instances,
    viewerId,
    pickingEnabled,
    hoverListeners
  ) {
    this.scene = new THREE.Scene();
    this.cameraManager = null;
    this.renderer = null;
    this.controls = null;
    this.mouse = { x: 0, y: 0 };
    this.frameId = null;
    this.meshFactory = new MeshFactory(this);

    this.viewerId = viewerId;
    this.pickingEnabled = pickingEnabled;
    this.hoverListeners = hoverListeners;

    const width = containerRef.clientWidth;
    const height = containerRef.clientHeight;

    // Setup Camera
    this.setupCamera(cameraOptions, width / height);

    // Setup Renderer
    this.setupRenderer(containerRef, backgroundColor, width, height);

    // Setup Lights
    this.setupLights();

    // Setup Controls
    this.setupControls(cameraHandler);

    // Setup Listeners
    this.setupListeners(selectionHandler);
  }

  /**
   * Setups the camera
   * @param cameraOptions
   * @param aspect
   */
  setupCamera(cameraOptions, aspect) {
    this.cameraManager = new CameraManager(this, {
      ...cameraOptions,
      ...{ aspect: aspect },
    });
  }

  /**
   * Setups the renderer
   * @param backgroundColor
   * @param width
   * @param height
   */
  setupRenderer(containerRef, backgroundColor, width, height) {
    // TODO: Add shaders
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setClearColor(backgroundColor);
    this.renderer.setSize(width, height);
    this.renderer.autoClear = false;
    containerRef.appendChild(this.renderer.domElement);
    const renderModel = new RenderPass(
      this.scene,
      this.cameraManager.getCamera()
    );
    this.composer = new EffectComposer(this.renderer);
    renderModel.renderToScreen = true;
    this.composer.addPass(renderModel);
  }

  /**
   * Setups the lights
   */
  setupLights() {
    const ambientLight = new THREE.AmbientLight(0x0c0c0c);
    this.scene.add(ambientLight);
    const spotLight = new THREE.SpotLight(0xffffff);
    spotLight.position.set(-30, 60, 60);
    spotLight.castShadow = true;
    this.scene.add(spotLight);
    this.cameraManager.getCamera().add(new THREE.PointLight(0xffffff, 1));
  }

  /**
   * Setups the controls
   * @param cameraHandler
   */
  setupControls(cameraHandler) {
    this.controls = new THREE.TrackballControls(
      this.cameraManager.getCamera(),
      this.renderer.domElement,
      this.viewerId,
      cameraHandler
    );
    this.controls.noZoom = false;
    this.controls.noPan = false;
  }

  /**
   * Returns intersected objects from mouse click
   *
   * @returns {Array} a list of objects intersected by the current mouse coordinates
   */
  getIntersectedObjects() {
    // create a Ray with origin at the mouse position and direction into th scene (camera direction)
    const vector = new THREE.Vector3(this.mouse.x, this.mouse.y, 1);
    vector.unproject(this.cameraManager.getCamera());

    const raycaster = new THREE.Raycaster(
      this.cameraManager.getCamera().position,
      vector.sub(this.cameraManager.getCamera().position).normalize()
    );
    raycaster.linePrecision = this.meshFactory.getLinePrecision();

    const visibleChildren = [];
    this.scene.traverse(function (child) {
      if (child.visible && !(child.clickThrough == true)) {
        if (child.geometry != null && child.geometry != undefined) {
          if (child.type !== 'Points') {
            child.geometry.computeBoundingBox();
          }
          visibleChildren.push(child);
        }
      }
    });

    const intersected = raycaster.intersectObjects(visibleChildren);

    // returns an array containing all objects in the scene with which the ray intersects
    return intersected;
  }

  /**
   * Adds instances to the ThreeJS Scene
   * @param proxyInstances
   */
  addInstancesToScene(proxyInstances) {
    const instances = proxyInstances.map((pInstance) => {
      return Instances.getInstance(pInstance.instancePath);
    });
    const meshes = this.meshFactory.start(instances);
    for (const meshKey in meshes) {
      this.scene.add(meshes[meshKey]);
    }
    this.updateInstancesColor(proxyInstances);
  }

  /**
   * Sets the color of the instances
   *
   * @param proxyInstances
   * @param color
   */
  updateInstancesColor(proxyInstances) {
    const sortedInstances = proxyInstances.sort((a, b) => {
      if (a.instancePath < b.instancePath) {
        return -1;
      }
      if (a.instancePath > b.instancePath) {
        return 1;
      }
      return 0;
    });
    for (const pInstance of sortedInstances) {
      if (pInstance.color) {
        this.setInstanceColor(pInstance.instancePath, pInstance.color);
      }
    }
  }
  setInstanceColor(path, color) {
    //TODO: Use opacity
    const entity = Instances.getInstance(path);
    if (entity.hasCapability('VisualCapability')) {
      if (entity instanceof Instance || entity instanceof ArrayInstance) {
        this.setColor(path, color);

        if (typeof entity.getChildren === 'function') {
          const children = entity.getChildren();
          for (let i = 0; i < children.length; i++) {
            this.setInstanceColor(children[i].getInstancePath(), color);
          }
        }
      } else if (entity instanceof Type || entity instanceof Variable) {
        // fetch all instances for the given type or variable and call hide on each
        // TODO: Pass ModelFactory to prop?
        const instances = GEPPETTO.ModelFactory.getAllInstancesOf(entity);
        for (let j = 0; j < instances.length; j++) {
          this.setInstanceColor(instances[j].getInstancePath(), color);
        }
      }
    }
    return this;
  }

  /**
   * Changes the color of a given instance
   *
   * @param instancePath
   * @param color
   */
  setColor(instancePath, color) {
    if (!this.hasInstance(instancePath)) {
      return;
    }
    var meshes = this.getRealMeshesForInstancePath(instancePath);
    if (meshes.length > 0) {
      for (var i = 0; i < meshes.length; i++) {
        var mesh = meshes[i];
        if (mesh) {
          var that = this;
          mesh.traverse(function (object) {
            if (Object.prototype.hasOwnProperty.call(object, 'material')) {
              that.setThreeColor(object.material.color, color);
              object.material.defaultColor = color;
            }
          });
        }
      }
    }
  }

  /**
   * Set up the listeners use to detect mouse movement and windoe resizing
   */
  setupListeners(selectionHandler) {
    const that = this;
    // when the mouse moves, call the given function
    this.renderer.domElement.addEventListener(
      'mousedown',
      function (event) {
        that.clientX = event.clientX;
        that.clientY = event.clientY;
      },
      false
    );

    // when the mouse moves, call the given function
    this.renderer.domElement.addEventListener(
      'mouseup',
      function (event) {
        if (event.target == that.renderer.domElement) {
          const x = event.clientX;
          const y = event.clientY;

          // If the mouse moved since the mousedown then don't consider this a selection
          if (
            typeof that.clientX === 'undefined' ||
            typeof that.clientY === 'undefined' ||
            x != that.clientX ||
            y != that.clientY
          ) {
            return;
          }

          that.mouse.y =
            -(
              (event.clientY -
                that.renderer.domElement.getBoundingClientRect().top) /
              that.renderer.domElement.getBoundingClientRect().height
            ) *
            2 +
            1;
          that.mouse.x =
            ((event.clientX -
              that.renderer.domElement.getBoundingClientRect().left) /
              that.renderer.domElement.getBoundingClientRect().width) *
            2 -
            1;

          if (event.button == 0) {
            // only for left click
            if (that.pickingEnabled) {
              const intersects = that.getIntersectedObjects();

              if (intersects.length > 0) {
                let selected = '';
                let geometryIdentifier = '';

                // sort intersects
                const compare = function (a, b) {
                  if (a.distance < b.distance) {
                    return -1;
                  }
                  if (a.distance > b.distance) {
                    return 1;
                  }
                  return 0;
                };

                intersects.sort(compare);

                let selectedIntersect;
                // Iterate and get the first visible item (they are now ordered by proximity)
                for (const i = 0; i < intersects.length; i++) {
                  // figure out if the entity is visible
                  let instancePath = '';
                  if (
                    Object.prototype.hasOwnProperty.call(
                      intersects[i].object,
                      'instancePath'
                    )
                  ) {
                    instancePath = intersects[i].object.instancePath;
                    geometryIdentifier =
                      intersects[i].object.geometryIdentifier;
                  } else {
                    // weak assumption: if the object doesn't have an instancePath its parent will
                    instancePath = intersects[i].object.parent.instancePath;
                    geometryIdentifier =
                      intersects[i].object.parent.geometryIdentifier;
                  }
                  if (instancePath != null || undefined) {
                    const instance = Instances.getInstance(instancePath);
                    const visible = instance.visible;

                    if (visible) {
                      selected = instancePath;
                      selectedIntersect = intersects[i];
                      break;
                    }
                  }
                }

                if (selected != '') {
                  if (
                    Object.prototype.hasOwnProperty.call(
                      that.meshFactory.meshes,
                      selected
                    )
                    //TODO:
                    // ) ||
                    // Object.prototype.hasOwnProperty.call(
                    //   that.splitMeshes,
                    //   selected
                    // )
                  ) {
                    // TODO:
                    // if (!GEPPETTO.isKeyPressed('shift')) {
                    //   that.deselectAll();
                    // }

                    const selectedIntersectCoordinates = [
                      selectedIntersect.point.x,
                      selectedIntersect.point.y,
                      selectedIntersect.point.z,
                    ];
                    if (geometryIdentifier == undefined) {
                      geometryIdentifier = '';
                    }
                    selectionHandler(
                      selected,
                      geometryIdentifier,
                      selectedIntersectCoordinates,
                      selectedIntersect.object.material.color
                    );
                  }
                }
              }
              // TODO:
              // } else if (GEPPETTO.isKeyPressed('ctrl')) {
              //   that.deselectAll();
              // }
            }
          }
        }
      },
      false
    );

    // TODO:
    // this.renderer.domElement.addEventListener(
    //   'mousemove',
    //   function(event) {
    //     that.mouse.y =
    //       -(
    //         (event.clientY -
    //           that.renderer.domElement.getBoundingClientRect().top) /
    //         that.renderer.domElement.height
    //       ) *
    //         2 +
    //       1;
    //     that.mouse.x =
    //       ((event.clientX -
    //         that.renderer.domElement.getBoundingClientRect().left) /
    //         that.renderer.domElement.width) *
    //         2 -
    //       1;
    //     if (that.hoverListeners) {
    //       var intersects = that.getIntersectedObjects();
    //       for (var listener in that.hoverListeners) {
    //         if (intersects.length != 0) {
    //           that.hoverListeners[listener](intersects);
    //         }
    //       }
    //     }
    //   },
    //   false
    // );
  }

  /**
   * Checks if instance has a mesh
   *
   * @param instance
   */
  hasInstance(instance) {
    const instancePath =
      typeof instance == 'string' ? instance : instance.getInstancePath();
    return this.meshFactory.meshes[instancePath] != undefined;
  }

  /**
   * Get Meshes associated to an instance
   *
   * @param {String}
   *            instancePath - Path of the instance
   */
  getRealMeshesForInstancePath(instancePath) {
    const meshes = [];
    if (instancePath in this.meshFactory.splitMeshes) {
      for (const keySplitMeshes in this.meshFactory.splitMeshes) {
        if (keySplitMeshes.startsWith(instancePath)) {
          meshes.push(this.meshFactory.splitMeshes[keySplitMeshes]);
        }
      }
    } else if (instancePath in this.meshFactory.meshes) {
      meshes.push(this.meshFactory.meshes[instancePath]);
    }
    return meshes;
  }

  setThreeColor(threeColor, color) {
    // eslint-disable-next-line no-restricted-globals
    if (!isNaN(color % 1)) {
      // we have an integer (hex) value
      threeColor.setHex(color);
    } else if (
      Object.prototype.hasOwnProperty.call(color, 'r') &&
      Object.prototype.hasOwnProperty.call(color, 'g') &&
      Object.prototype.hasOwnProperty.call(color, 'b')
    ) {
      threeColor.r = color.r;
      threeColor.g = color.g;
      threeColor.b = color.b;
    } else {
      threeColor.set(color);
    }
  }

  update(proxyInstances, toTraverse) {
    // TODO: Add camera
    if (toTraverse) {
      this.addInstancesToScene(proxyInstances);
      //this.setAllGeometriesType(this.getDefaultGeometryType());

      this.scene.updateMatrixWorld(true);
      this.cameraManager.resetCamera();
    } else {
      this.updateInstancesColor(proxyInstances);
    }
  }

  start = (proxyInstances) => {
    this.update(proxyInstances, true)
    if (!this.frameId) {
      this.frameId = requestAnimationFrame(this.animate);
    }
  };

  animate = () => {
    this.controls.update();
    this.renderScene();
    this.frameId = window.requestAnimationFrame(this.animate);
  };

  renderScene = () => {
    this.renderer.render(this.scene, this.cameraManager.getCamera());
  };

  stop = () => {
    cancelAnimationFrame(this.frameId);
  };

  /**
   * Returns the scene renderer
   * @returns renderer
   */
  getRenderer() {
    return this.renderer;
  }
  /**
   * Returns the scene
   * @returns scene
   */
  getScene() {
    return this.scene;
  }
}
