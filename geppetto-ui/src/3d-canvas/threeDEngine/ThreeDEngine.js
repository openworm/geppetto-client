import * as THREE from 'three';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { BloomPass } from 'three/examples/jsm/postprocessing/BloomPass.js';
import { FilmPass } from 'three/examples/jsm/postprocessing/FilmPass.js';
import { FocusShader } from 'three/examples/jsm/shaders/FocusShader.js';

import MeshFactory from './MeshFactory';
import CameraManager from './CameraManager';
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
    pickingEnabled,
    linesThreshold,
    hoverListeners
  ) {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(backgroundColor);
    this.cameraManager = null;
    this.renderer = null;
    this.controls = null;
    this.mouse = { x: 0, y: 0 };
    this.frameId = null;
    this.meshFactory = new MeshFactory(this.scene, linesThreshold);
    this.pickingEnabled = pickingEnabled;
    this.hoverListeners = hoverListeners;
    this.cameraHandler = cameraHandler;

    this.width = containerRef.clientWidth;
    this.height = containerRef.clientHeight;

    // Setup Camera
    this.setupCamera(cameraOptions, this.width / this.height);

    // Setup Renderer
    this.setupRenderer(containerRef);

    // Setup Lights
    this.setupLights();

    // Setup Controls
    this.setupControls();

    // Setup Listeners
    this.setupListeners(selectionHandler);

    this.start = this.start.bind(this);
    this.animate = this.animate.bind(this);
    this.renderScene = this.renderScene.bind(this);
    this.stop = this.stop.bind(this);
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
   * @param containerRef
   */
  setupRenderer(containerRef) {
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setSize(this.width, this.height);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.autoClear = false;
    containerRef.appendChild(this.renderer.domElement);
    this.configureRenderer(false);
  }

  /**
   *
   * @param shaders
   */
  configureRenderer(shaders) {
    if (shaders == undefined) {
      shaders = false;
    }

    const renderModel = new RenderPass(
      this.scene,
      this.cameraManager.getCamera()
    );
    this.composer = new EffectComposer(this.renderer);

    if (shaders) {
      const effectBloom = new BloomPass(0.75);
      const effectFilm = new FilmPass(0.5, 0.5, 1448, false);
      const effectFocus = new ShaderPass(FocusShader);

      effectFocus.uniforms['screenWidth'].value = this.width;
      effectFocus.uniforms['screenHeight'].value = this.height;
      effectFocus.renderToScreen = true;

      this.composer.addPass(renderModel);
      this.composer.addPass(effectBloom);
      this.composer.addPass(effectFilm);
      this.composer.addPass(effectFocus);
    } else {
      // standard
      renderModel.renderToScreen = true;
      this.composer.addPass(renderModel);
    }
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

  setupControls() {
    this.controls = new THREE.TrackballControls(
      this.cameraManager.getCamera(),
      this.renderer.domElement,
      this.cameraHandler
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
    this.scene.traverse(function(child) {
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
    this.meshFactory.start(instances);
    this.updateGroupMeshes(proxyInstances);
  }

  /**
   * Clears the scene
   *
   */
  clearScene() {
    const toRemove = this.scene.children.filter(
      (child) => child.type === 'Mesh'
    );
    for (let child of toRemove) {
      this.scene.remove(child);
    }
  }

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
      if (pInstance.visualGroups) {
        const instance = Instances.getInstance(pInstance.instancePath);
        const visualGroups = this.getVisualElements(
          instance,
          pInstance.visualGroups
        );
        this.setSplitGroupsColor(pInstance.instancePath, visualGroups);
      }
    }
  }

  updateInstancesConnectionLines(proxyInstances) {
    for (const pInstance of proxyInstances) {
      const mode =  pInstance.showConnectionLines? pInstance.showConnectionLines: false
      this.showConnectionLines(pInstance.instancePath, mode);
    }
  }

  /**
   * Sets the color of the instances
   *
   * @param proxyInstances
   * @param color
   */
  setInstanceColor(path, color) {
    const entity = Instances.getInstance(path);
    if (entity.hasCapability('VisualCapability')) {
      if (entity instanceof Instance || entity instanceof ArrayInstance) {
        this.meshFactory.setColor(path, color);

        if (typeof entity.getChildren === 'function') {
          const children = entity.getChildren();
          for (let i = 0; i < children.length; i++) {
            this.setInstanceColor(children[i].getInstancePath(), color);
          }
        }
      } else if (entity instanceof Type || entity instanceof Variable) {
        // fetch all instances for the given type or variable and call hide on each
        const instances = GEPPETTO.ModelFactory.getAllInstancesOf(entity);
        for (let j = 0; j < instances.length; j++) {
          this.setInstanceColor(instances[j].getInstancePath(), color);
        }
      }
    }
    return this;
  }

  /**
   *
   * @param instancePath
   * @param visualGroups
   */
  setSplitGroupsColor(instancePath, visualGroups) {
    for (const g in visualGroups) {
      // retrieve visual group object
      const group = visualGroups[g];

      // get full group name to access group mesh
      let groupName = g;
      if (groupName.indexOf(instancePath) <= -1) {
        groupName = instancePath + '.' + g;
      }

      // get group mesh
      const groupMesh = this.meshFactory.getMeshes()[groupName];
      groupMesh.visible = true;
      this.meshFactory.setThreeColor(groupMesh.material.color, group.color);
    }
  }

  updateGroupMeshes(proxyInstances) {
    for (const pInstance of proxyInstances) {
      if (pInstance.visualGroups) {
        const instance = Instances.getInstance(pInstance.instancePath);
        const visualGroups = this.getVisualElements(
          instance,
          pInstance.visualGroups
        );
        this.meshFactory.splitGroups(instance, visualGroups);
      }
    }
    const meshes = this.meshFactory.getMeshes();
    this.clearScene();
    for (const meshKey in meshes) {
      this.scene.add(meshes[meshKey]);
    }
  }

  getVisualElements(instance, visualGroups) {
    const groups = {};
    if (visualGroups.index != null) {
      const vg = instance.getVisualGroups()[visualGroups.index];
      const visualElements = vg.getVisualGroupElements();
      const allElements = [];
      for (let i = 0; i < visualElements.length; i++) {
        if (visualElements[i].getValue() != null) {
          allElements.push(visualElements[i].getValue());
        }
      }

      let minDensity = Math.min.apply(null, allElements);
      let maxDensity = Math.max.apply(null, allElements);

      // highlight all reference nodes
      for (let j = 0; j < visualElements.length; j++) {
        groups[visualElements[j].getId()] = {};
        let color = visualElements[j].getColor();
        if (visualElements[j].getValue() != null) {
          let intensity = 1;
          if (maxDensity != minDensity) {
            intensity =
              (visualElements[j].getValue() - minDensity) /
              (maxDensity - minDensity);
          }

          color = GEPPETTO.Utility.rgbToHex(
            255,
            Math.floor(255 - 255 * intensity),
            0
          );
        }
        groups[visualElements[j].getId()].color = color;
      }
    }

    for (const c in visualGroups.custom) {
      if (c in groups) {
        groups[c].color = visualGroups.custom[c].color;
      }
    }

    return groups;
  }
  /**
     * Show connection lines for this instance.
     *
     * @param instancePath
     * @param {boolean} mode - Show or hide connection lines
     */
    showConnectionLines (instancePath, mode) {
      if (mode == null || mode == undefined) {
        mode = true;
      }
      const entity = Instances.getInstance(instancePath);
      if (entity instanceof Instance || entity instanceof ArrayInstance) {
        // show or hide connection lines
        if (mode) {
          this.showConnectionLinesForInstance(entity);
        } else {
          this.removeConnectionLines(entity);
        }
      } else if (entity instanceof Type || entity instanceof Variable) {
        // fetch all instances for the given type or variable and call hide on each
        const instances = GEPPETTO.ModelFactory.getAllInstancesOf(entity);
        for (const j = 0; j < instances.length; j++) {
          if (instances[j].hasCapability('VisualCapability')) {
            this.showConnectionLines(instances[j], mode);
          }
        }
      }
    }

    /**
     *
     *
     * @param instance
     */
    showConnectionLinesForInstance (instance) {
      const connections = instance.getConnections();

      const mesh = this.meshFactory.meshes[instance.getInstancePath()];
      const inputs = {};
      const outputs = {};
      const defaultOrigin = mesh.position.clone();

      for (let c = 0; c < connections.length; c++) {

        const connection = connections[c];
        const type = connection.getA().getPath() == instance.getInstancePath()
          ? GEPPETTO.Resources.OUTPUT
          : GEPPETTO.Resources.INPUT;

        const thisEnd = connection.getA().getPath() == instance.getInstancePath() ? connection.getA() : connection.getB();
        const otherEnd = connection.getA().getPath() == instance.getInstancePath() ? connection.getB() : connection.getA();
        const otherEndPath = otherEnd.getPath();

        const otherEndMesh = this.meshFactory.meshes[otherEndPath];

        let destination;
        let origin;

        if (thisEnd.getPoint() == undefined) {
          // same as before
          origin = defaultOrigin;
        } else {
          // the specified coordinate
          const p = thisEnd.getPoint();
          origin = new THREE.Vector3(p.x + mesh.position.x, p.y + mesh.position.y, p.z + mesh.position.z);
        }

        if (otherEnd.getPoint() == undefined) {
          // same as before
          destination = otherEndMesh.position.clone();
        } else {
          // the specified coordinate
          const p = otherEnd.getPoint();
          destination = new THREE.Vector3(p.x + otherEndMesh.position.x, p.y + otherEndMesh.position.y, p.z + otherEndMesh.position.z);
        }

        const geometry = new THREE.Geometry();

        geometry.vertices.push(origin, destination);
        geometry.verticesNeedUpdate = true;
        geometry.dynamic = true;

        let colour = null;


        if (type == GEPPETTO.Resources.INPUT) {

          colour = GEPPETTO.Resources.COLORS.INPUT_TO_SELECTED;

          // figure out if connection is both, input and output
          if (outputs[otherEndPath]) {
            colour = GEPPETTO.Resources.COLORS.INPUT_AND_OUTPUT;
          }

          if (inputs[otherEndPath]) {
            inputs[otherEndPath].push(connection.getInstancePath());
          } else {
            inputs[otherEndPath] = [];
            inputs[otherEndPath].push(connection.getInstancePath());
          }
        } else if (type == GEPPETTO.Resources.OUTPUT) {

          colour = GEPPETTO.Resources.COLORS.OUTPUT_TO_SELECTED;
          // figure out if connection is both, input and output
          if (inputs[otherEndPath]) {
            colour = GEPPETTO.Resources.COLORS.INPUT_AND_OUTPUT;
          }

          if (outputs[otherEndPath]) {
            outputs[otherEndPath].push(connection.getInstancePath());
          } else {
            outputs[otherEndPath] = [];
            outputs[otherEndPath].push(connection.getInstancePath());
          }
        }

        const material = new THREE.LineDashedMaterial({ dashSize: 3, gapSize: 1 });
        this.meshFactory.setThreeColor(material.color, colour);

        const line = new THREE.LineSegments(geometry, material);
        line.updateMatrixWorld(true);


        if (this.meshFactory.connectionLines[connection.getInstancePath()]) {
          this.scene.remove(this.meshFactory.connectionLines[connection.getInstancePath()]);
        }

        this.scene.add(line);
        this.meshFactory.connectionLines[connection.getInstancePath()] = line;
      }
    }

    /**
     * Removes connection lines, all if nothing is passed in or just the ones passed in.
     *
     * @param instance - optional, instance for which we want to remove the connections
     */
    removeConnectionLines (instance) {
      if (instance != undefined) {
        const connections = instance.getConnections();
        // get connections for given instance and remove only those
        const lines = this.meshFactory.connectionLines;
        for (let i = 0; i < connections.length; i++) {
          if (Object.prototype.hasOwnProperty.call(lines, connections[i].getInstancePath())) {
            // remove the connection line from the scene
            this.scene.remove(lines[connections[i].getInstancePath()]);
            // remove the conneciton line from the GEPPETTO list of connection lines
            delete lines[connections[i].getInstancePath()];
          }
        }
      } else {
        // remove all connection lines
        const lines = this.meshFactory.connectionLines;
        for (var key in lines) {
          if (Object.prototype.hasOwnProperty.call(lines, key)) {
            this.scene.remove(lines[key]);
          }
        }
        this.meshFactory.connectionLines = [];
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
      function(event) {
        that.clientX = event.clientX;
        that.clientY = event.clientY;
      },
      false
    );

    // when the mouse moves, call the given function
    this.renderer.domElement.addEventListener(
      'mouseup',
      function(event) {
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
                // sort intersects
                const compare = function(a, b) {
                  if (a.distance < b.distance) {
                    return -1;
                  }
                  if (a.distance > b.distance) {
                    return 1;
                  }
                  return 0;
                };

                intersects.sort(compare);

                let selectedMap = {};
                // Iterate and get the first visible item (they are now ordered by proximity)
                for (let i = 0; i < intersects.length; i++) {
                  // figure out if the entity is visible
                  let instancePath = '';
                  let geometryIdentifier = '';
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
                  if (
                    (instancePath != null &&
                      Object.prototype.hasOwnProperty.call(
                        that.meshFactory.meshes,
                        instancePath
                      )) ||
                    Object.prototype.hasOwnProperty.call(
                      that.meshFactory.splitMeshes,
                      instancePath
                    )
                  ) {
                    if (geometryIdentifier == undefined) {
                      geometryIdentifier = '';
                    }
                    if (!(instancePath in selectedMap)) {
                      selectedMap[instancePath] = {
                        ...intersects[i],
                        geometryIdentifier: geometryIdentifier,
                        distanceIndex: i,
                      };
                    }
                  }
                }

                selectionHandler(selectedMap);
              }
            }
          }
        }
      },
      false
    );

    this.renderer.domElement.addEventListener(
      'mousemove',
      function(event) {
        that.mouse.y =
          -(
            (event.clientY -
              that.renderer.domElement.getBoundingClientRect().top) /
            that.renderer.domElement.height
          ) *
            2 +
          1;
        that.mouse.x =
          ((event.clientX -
            that.renderer.domElement.getBoundingClientRect().left) /
            that.renderer.domElement.width) *
            2 -
          1;
        if (that.hoverListeners) {
          const intersects = that.getIntersectedObjects();
          for (const listener in that.hoverListeners) {
            if (intersects.length != 0) {
              that.hoverListeners[listener](intersects);
            }
          }
        }
      },
      false
    );
  }

  /**
   * Sets whether to use wireframe for the materials of the meshes
   * @param wireframe
   */
  setWireframe(wireframe) {
    this.wireframe = wireframe;
    const that = this;
    this.scene.traverse(function(child) {
      if (child instanceof THREE.Mesh) {
        if (!(child.material.nowireframe == true)) {
          child.material.wireframe = that.wireframe;
        }
      }
    });
  }

  update(proxyInstances, cameraOptions, toTraverse) {
    if (toTraverse) {
      this.addInstancesToScene(proxyInstances);
      //this.setAllGeometriesType(this.getDefaultGeometryType());

      this.scene.updateMatrixWorld(true);
    }
    this.updateInstancesColor(proxyInstances);
    this.updateInstancesConnectionLines(proxyInstances);
    this.cameraManager.update(cameraOptions);
  }

  start(proxyInstances, cameraOptions, toTraverse) {
    this.update(proxyInstances, cameraOptions, toTraverse);
    if (!this.frameId) {
      this.frameId = window.requestAnimationFrame(this.animate);
    }
  }

  animate() {
    this.controls.update();
    this.renderScene();
    this.frameId = window.requestAnimationFrame(this.animate);
  }

  renderScene() {
    this.renderer.render(this.scene, this.cameraManager.getCamera());
  }

  stop() {
    cancelAnimationFrame(this.frameId);
  }

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
  /**
   * Returns the wireframe flag
   * @returns wireframe
   */
  getWireframe() {
    return this.wireframe;
  }
}
