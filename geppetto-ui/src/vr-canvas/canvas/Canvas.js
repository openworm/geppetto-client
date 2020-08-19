/* eslint-disable no-template-curly-in-string */
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Instance from '@geppettoengine/geppetto-core/model/Instance';
import ArrayInstance from '@geppettoengine/geppetto-core/model/ArrayInstance';
import Type from '@geppettoengine/geppetto-core/model/Type';
import Variable from '@geppettoengine/geppetto-core/model/Variable';
import 'aframe';
import 'aframe-slice9-component';
import MeshFactory from '@geppettoengine/geppetto-ui/3d-canvas/threeDEngine/MeshFactory';
import LaserControls from '../LaserControls';
import Menu from '../menu/Menu';
import '../aframe/interactable';
import '../aframe/thumbstick-controls';
import '../aframe/rig-wasd-controls';
import { MAIN_MENU } from '../menu/menuStates';
import {
  MENU_CLICK,
  BACK_MENU,
  VISUAL_GROUPS,
  RUN_SIMULATION,
  COLLAPSE_MENU,
  BRING_CLOSER,
} from '../Events';

import {
  getSimulationData,
  getVoltageColor,
} from '../utilities/GeppettoSimulation';
import ColorController from './ColorController';
import particle from '../assets/particle.png';

const HOVER_COLOR = { r: 0.67, g: 0.84, b: 0.9 };
const SELECTED_COLOR = { r: 1, g: 1, b: 0 };
const SHORTCUTS = {
  COLLAPSE_MENU: 109,
  BRING_CLOSER: 99,
};

class Canvas extends Component {
  constructor(props) {
    super(props);
    this.state = {
      loadedTextures: false,
      visualGroups: false,
      currentMenu: MAIN_MENU.id,
      isMenuVisible: true,
      simulation: false,
      time: 0,
      simulationData: null,
    };
    this.canvasRef = React.createRef();
    this.sceneRef = React.createRef();
    this.handleLoadedTextures = this.handleLoadedTextures.bind(this);
    this.handleHover = this.handleHover.bind(this);
    this.handleHoverLeave = this.handleHoverLeave.bind(this);
    this.handleClick = this.handleClick.bind(this);
    this.handleMenuClick = this.handleMenuClick.bind(this);
    this.handleKeyboardPress = this.handleKeyboardPress.bind(this);
    // TODO: remove this workaround
    this.activateVisualGroups = this.activateVisualGroups.bind(this);
    this.threeMeshes = {};
    this.selectedMeshes = {};
    this.hoveredMeshes = {};
    this.isReady = false;
    this.menuHistory = [];
    this.timer = null;
    this.initTextures(this.handleLoadedTextures);
  }

  initTextures(callback) {
    const textureLoader = new THREE.TextureLoader();
    textureLoader.load(particle, (texture) => {
      this.particleTexture = texture;
      callback();
    });
  }

  componentDidMount() {
    const { id, threshold } = this.props;
    const scene = document.getElementById(`${id}_scene`);
    this.meshFactory = new MeshFactory(
      scene.object3D,
      threshold,
      300,
      1,
      null,
      THREE
    );
    this.colorController = new ColorController(this.meshFactory);

    this.sceneRef.current.addEventListener('mesh_hover', this.handleHover);
    this.sceneRef.current.addEventListener(
      'mesh_hover_leave',
      this.handleHoverLeave
    );
    this.sceneRef.current.addEventListener('mesh_click', this.handleClick);
    this.sceneRef.current.addEventListener('menu_click', this.handleMenuClick);
    document.addEventListener('keypress', this.handleKeyboardPress);
    this.sceneRef.current.addEventListener(
      COLLAPSE_MENU,
      this.handleKeyboardPress
    );
    // TODO: remove this workaround
    this.sceneRef.current.addEventListener(VISUAL_GROUPS, (evt) =>
      this.activateVisualGroups(
        evt.detail.groups,
        evt.detail.mode,
        evt.detail.instances
      )
    );

    const { colorMap } = this.props;
    if (colorMap !== {}) {
      for (const path in colorMap) {
        this.setColor(path, colorMap[path]);
      }
    }

    this.setEntityMeshes();
  }

  shouldComponentUpdate(nextProps) {
    const { instances } = this.props;
    if (instances !== nextProps.instances) {
      this.meshFactory.start(nextProps.instances);
      this.setState({ visualGroups: false });
    }
    return true;
  }

  componentDidUpdate() {
    const { colorMap } = this.props;
    const { visualGroups, time, simulationData, simulation } = this.state;
    if (!visualGroups) {
      if (colorMap !== {}) {
        for (const path in colorMap) {
          this.setColor(path, colorMap[path]);
        }
      }
    }
    this.setEntityMeshes();
    if (simulation) {
      if (time === Object.keys(simulationData).length - 1) {
        // eslint-disable-next-line react/no-did-update-set-state
        this.setState({
          simulation: false,
          visualGroups: false,
          simulationData: null,
          time: 0,
        });
        clearInterval(this.timer);
      }
    }
  }

  setColor(path, color) {
    // eslint-disable-next-line no-eval
    const entity = eval(path);
    if (entity.hasCapability('VisualCapability')) {
      if (entity instanceof Instance || entity instanceof ArrayInstance) {
        this.meshFactory.setColor(path, color);

        if (typeof entity.getChildren === 'function') {
          const children = entity.getChildren();
          for (let i = 0; i < children.length; i++) {
            this.setColor(children[i].getInstancePath(), color);
          }
        }
      } else if (entity instanceof Type || entity instanceof Variable) {
        // fetch all instances for the given type or variable and call hide on each
        // TODO: Pass ModelFactory to prop?
        const instances = GEPPETTO.ModelFactory.getAllInstancesOf(entity);
        for (let j = 0; j < instances.length; j++) {
          this.setColor(instances[j].getInstancePath(), color);
        }
      }
    }
    return this;
  }

  setEntityMeshes() {
    const canvasEntity = this.canvasRef.current;

    const sceneMeshes = [];
    const keysThreeMeshes = Object.keys(this.threeMeshes).filter(
      (key) => this.threeMeshes[key].visible
    );
    for (let i = 0; i < canvasEntity.children.length; i++) {
      const element = canvasEntity.children[i];
      if (element.id.startsWith('a-entity')) {
        sceneMeshes.push(element);
      }
    }
    if (sceneMeshes.length !== keysThreeMeshes.length) {
      throw new Error(
        'Meshes do not match. Possible illegal use of a-entity as id.'
      );
    }
    let i = 0;
    for (const meshKey of keysThreeMeshes) {
      const entity = sceneMeshes[i];
      const mesh = this.threeMeshes[meshKey];
      entity.setObject3D('mesh', mesh);
      i++;
    }
  }

  handleLoadedTextures() {
    this.setState({ loadedTextures: true });
  }

  handleHover(evt) {
    const { handleHover } = this.props;
    if (Object.keys(this.hoveredMeshes).includes(evt.detail.id)) {
      return;
    }
    if (
      evt.detail.getObject3D('mesh') !== undefined &&
      evt.detail.getObject3D('mesh').material
    ) {
      this.hoveredMeshes[evt.detail.id] = {
        ...evt.detail.getObject3D('mesh').material.color,
      };
      evt.detail
        .getObject3D('mesh')
        .material.color.setRGB(HOVER_COLOR.r, HOVER_COLOR.g, HOVER_COLOR.b);
      handleHover(evt, false);
    }
  }

  handleHoverLeave(evt) {
    const { handleHoverLeave } = this.props;
    if (Object.keys(this.hoveredMeshes).includes(evt.detail.id)) {
      const color = this.hoveredMeshes[evt.detail.id];
      evt.detail
        .getObject3D('mesh')
        .material.color.setRGB(color.r, color.g, color.b);

      delete this.hoveredMeshes[evt.detail.id];
    }
    handleHoverLeave(evt, false);
  }

  handleKeyboardPress(evt) {
    // eslint-disable-next-line eqeqeq
    if (evt.keyCode === SHORTCUTS.COLLAPSE_MENU) {
      const { isMenuVisible } = this.state;
      this.setState({ isMenuVisible: !isMenuVisible });
    } else if (evt.keyCode === SHORTCUTS.BRING_CLOSER) {
      let toModel = true;
      const cEvent = new CustomEvent(BRING_CLOSER, { detail: null });
      // TODO: Only works for 1 selected object atm
      if (Object.keys(this.selectedMeshes).length === 1) {
        for (const selected of Object.keys(this.selectedMeshes)) {
          const el = document.getElementById(selected);
          el.dispatchEvent(cEvent);
          toModel = false;
        }
        if (toModel) {
          const { id } = this.props;
          const modelID = `${id}_model`;
          const model = document.getElementById(modelID);
          model.dispatchEvent(cEvent);
        }
      }
    }
  }

  handleClick(evt) {
    const { handleClick } = this.props;
    const preventDefault = handleClick(evt);
    if (!preventDefault && evt.detail.getObject3D('mesh') !== undefined) {
      if (Object.keys(this.selectedMeshes).includes(evt.detail.id)) {
        // eslint-disable-next-line no-param-reassign
        evt.detail.selected = false;
        const color = this.selectedMeshes[evt.detail.id];
        evt.detail.getObject3D('mesh').material.color.set(color);
        delete this.selectedMeshes[evt.detail.id];
        this.hoveredMeshes = {
          ...evt.detail.getObject3D('mesh').material.color,
        };
      } else {
        // eslint-disable-next-line no-param-reassign
        evt.detail.selected = true;
        const meshCopy = evt.detail.getObject3D('mesh').material.defaultColor;
        this.selectedMeshes[evt.detail.id] = meshCopy;

        evt.detail
          .getObject3D('mesh')
          .material.color.setRGB(
            SELECTED_COLOR.r,
            SELECTED_COLOR.g,
            SELECTED_COLOR.b
          );

        this.hoveredMeshes = {
          ...evt.detail.getObject3D('mesh').material.color,
        };
      }
    }
  }

  handleMenuClick(evt) {
    const { model } = this.props;
    const { currentMenu } = this.state;
    const { event, detail } = evt.detail;
    if (event === MENU_CLICK) {
      this.menuHistory.push(currentMenu);
      this.setState({ currentMenu: detail });
    } else if (event === BACK_MENU) {
      const lastMenu = this.menuHistory.pop();
      this.setState({ currentMenu: lastMenu });
    } else if (event === VISUAL_GROUPS) {
      // eslint-disable-next-line no-eval
      eval(
        `network_CA1PyramidalCell.CA1_CG[0].getVisualGroups()[${parseInt(
          detail,
          10
        )}].show(true)`
      );
    } else if (event === RUN_SIMULATION) {
      const t0 = performance.now();

      this.colorController.addColorFunction(
        GEPPETTO.ModelFactory.instances.getInstance(
          GEPPETTO.ModelFactory.getAllPotentialInstancesEndingWith('.v')
        ),
        getVoltageColor
      );
      const t1 = performance.now();
      console.log(`Call to addColorFunction took ${t1 - t0} milliseconds.`);
      this.timer = setInterval(() => {
        const { time } = this.state;
        this.setState({ time: time + model.simulation.step });
      }, 10);
      this.setState({
        currentMenu: MAIN_MENU.id,
        simulation: true,
        visualGroups: true,
        simulationData: getSimulationData(model.simulation),
      });
    }
  }

  /**
   * Activates a visual group
   * @param visualGroup
   * @param mode
   * @param instances
   */
  activateVisualGroups(visualGroup, mode, instances) {
    this.showVisualGroups(visualGroup, mode, instances);
    this.setState({
      visualGroups: true,
    });
  }

  /**
   * Shows a visual group
   * @param visualGroups
   * @param mode
   * @param instances
   */
  showVisualGroups(visualGroups, mode, instances) {
    for (let i = 0; i < instances.length; i++) {
      const instance = instances[i];
      const instancePath = instance.getInstancePath();
      this.merge(instancePath, true);
      if (mode) {
        const mergedMesh = this.meshFactory.meshes[instancePath];
        const map = mergedMesh.mergedMeshesPaths;
        // no mergedMeshesPaths means object hasn't been merged, single object
        if (map != undefined || null) {
          this.meshFactory.splitGroups(instance, visualGroups);
          this.showVisualGroupsRaw(
            visualGroups,
            instance,
            this.meshFactory.splitMeshes
          );
        } else {
          this.showVisualGroupsRaw(
            visualGroups,
            instance,
            this.meshFactory.meshes
          );
        }
      }
    }
  }

  /**
   *
   * @param visualGroups
   * @param instance
   * @param meshesContainer
   */
  showVisualGroupsRaw(visualGroups, instance, meshesContainer) {
    const instancePath = instance.getInstancePath();
    for (const g in visualGroups) {
      // retrieve visual group object
      const visualGroup = visualGroups[g];

      // get full group name to access group mesh
      let groupName = g;
      if (groupName.indexOf(instancePath) <= -1) {
        groupName = `${instancePath}.${g}`;
      }

      // get group mesh
      const groupMesh = meshesContainer[groupName];
      groupMesh.visible = true;
      this.meshFactory.setThreeColor(
        groupMesh.material.color,
        visualGroup.color
      );
    }
  }

  /**
   * Merge mesh that was split before
   *
   *            aspectPath - Path to aspect that points to mesh
   * @param instancePath
   * @param visible
   */
  merge(instancePath, visible) {
    // get mesh from map
    const mergedMesh = this.meshFactory.meshes[instancePath];

    // if merged mesh is not visible, turn it on and turn split one off
    if (!mergedMesh.visible) {
      for (const path in this.meshFactory.splitMeshes) {
        // retrieve split mesh that is on the scene
        const splitMesh = this.meshFactory.splitMeshes[path];
        if (splitMesh) {
          if (instancePath == splitMesh.instancePath) {
            splitMesh.visible = false;
          }
        }
      }
      if (visible) {
        // add merged mesh to scene and set flag to true
        mergedMesh.visible = true;
      }
    }
  }

  render() {
    const {
      sceneBackground,
      model,
      instances,
      id,
      position,
      rotation,
      embedded,
    } = this.props;
    const {
      loadedTextures,
      currentMenu,
      isMenuVisible,
      simulation,
      time,
      simulationData,
    } = this.state;
    const sceneID = `${id}_scene`;
    const cameraID = `${id}_camera`;
    const modelID = `${id}_model`;

    if (loadedTextures) {
      if (!this.isReady) {
        this.meshFactory.setParticleTexture(this.particleTexture);
        this.meshFactory.start(instances);
        this.isReady = true;
      }
      this.threeMeshes = this.meshFactory.getMeshes();
    }

    if (simulation) {
      const simulationTime = Object.keys(simulationData)[time];
      for (const v of Object.keys(simulationData[simulationTime])) {
        const variable = v.substring(0, v.lastIndexOf('.'));
        this.colorController.colorInstance(
          variable,
          getVoltageColor,
          parseFloat(simulationData[simulationTime][v])
        );
      }
    }

    return (
      <a-scene
        id={sceneID}
        ref={this.sceneRef}
        background={sceneBackground}
        loading-screen="dotsColor: orange; backgroundColor: black"
        class="scene"
        shadow="enabled: false; autoUpdate: false"
        light="defaultLightsEnabled: false"
        embedded={embedded}
      >
        <a-assets>
          <img
            id="sliceImg"
            alt="slice_image"
            src="https://cdn.glitch.com/0ddef241-2c1a-4bc2-8d47-58192c718908%2Fslice.png?1557308835598"
            crossOrigin="true"
          />

          <a-mixin
            id="buttonBackground"
            mixin="slice"
            slice9="width: 1.3; height: 0.3; color: #030303"
          />
          <a-mixin
            id="buttonText"
            mixin="font"
            text="align: center; width: 2.5; zOffset: 0.01; color: #333"
          />

          <a-mixin
            id="button"
            mixin="buttonBackground buttonText"
            class="collidable"
          />

          <a-mixin
            id="slice"
            slice9="color: #050505; transparent: true; opacity: 0.9; src: #sliceImg; left: 50; right: 52; top: 50; bottom: 52; padding: 0.15"
          />
        </a-assets>

        <a-entity
          id={cameraID}
          position="0 5 0"
          thumbstick-controls={`id: ${id}; acceleration:200`}
          rig-wasd-controls="fly:true; acceleration:200"
        >
          <a-camera cursor="rayOrigin: mouse" wasd-controls="enabled:false" />
          <LaserControls id={id} />
          {isMenuVisible ? (
            <Menu id={id} currentMenu={currentMenu} currentModel={model} />
          ) : null}
        </a-entity>

        <a-plane
          position="0 0 -4"
          rotation="-90 0 0"
          width="100"
          height="100"
          color="#7BC8A4"
        />
        <a-entity
          ref={this.canvasRef}
          position={position}
          rotation={rotation}
          scale="0.1, 0.1 0.1"
          id={modelID}
          interactable={`id: ${id}`}
        >
          {Object.keys(this.threeMeshes)
            .filter((key) => this.threeMeshes[key].visible)
            .map((key) => (
              // eslint-disable-next-line react/no-array-index-key
              <a-entity
                class="collidable"
                key={`a-entity${key}_${id}`}
                id={`a-entity${key}_${id}`}
                interactable={`id: ${id}`}
              />
            ))}
        </a-entity>
      </a-scene>
    );
  }
}

Canvas.defaultProps = {
  threshold: 1000,
  colorMap: {},
  position: '-20 -20 -80',
  rotation: '0 0 0',
  sceneBackground: 'color: #ECECEC',
  handleHover: () => {
    return false;
  },
  handleClick: () => {
    return false;
  },
  handleHoverLeave: () => {},
  handleModelChange: () => {},
};

//TODO: Add comments, fix instances subprop
Canvas.propTypes = {
  instances: PropTypes.arrayOf(PropTypes.object).isRequired,
  model: PropTypes.object.isRequired,
  id: PropTypes.string.isRequired,
  threshold: PropTypes.number,
  colorMap: PropTypes.object,
  position: PropTypes.string,
  rotation: PropTypes.string,
  sceneBackground: PropTypes.string,
  handleHover: PropTypes.func,
  handleClick: PropTypes.func,
  handleHoverLeave: PropTypes.func,
  handleModelChange: PropTypes.func,
};

export default Canvas;
