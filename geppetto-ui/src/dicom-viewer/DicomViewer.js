import React, { Component } from 'react';
import { withStyles } from '@material-ui/core';
import PropTypes from 'prop-types';

import * as THREE from 'three';
import DicomViewerUtils from './DicomViewerUtils';
import { offset } from '../utilities';
import { boundingBoxHelperFactory, VolumeLoader, StackModel } from 'ami.js';
const HelpersBoundingBox = boundingBoxHelperFactory(THREE);

import {
  faThLarge,
  faSquare,
  faExchangeAlt,
  faDownload,
  faExpandAlt,
  faCompressAlt,
} from '@fortawesome/free-solid-svg-icons';
import CustomToolbar from '../common/CustomToolbar';
import { createZipFromRemoteFiles } from '@geppettoengine/geppetto-core/Utility';

const styles = {
  dicomViewer: {
    display: 'flex',
    flexWrap: 'wrap',
    backgroundColor: '#353535',
  },
  renderer: {
    backgroundColor: '#000',
    float: 'left',
    width: '50%',
    height: '50%',
  },
  toolbar: {
    padding: '0',
    marginLeft: '5px',
  },
  toolbarBox: { backgroundColor: 'rgb(0,0,0,0.5);' },
  button: {
    padding: '8px',
    top: '0',
    color: '#fc6320',
  },
};

class DicomViewer extends Component {
  constructor (props) {
    super(props);

    this.state = {
      files: this.extractFilesPath(this.props.data),
      mode: this.props.mode === undefined ? 'quad_view' : this.props.mode,
      orientation:
        this.props.orientation === undefined
          ? 'coronal'
          : this.props.orientation,
      fullScreen: false,
    };

    // 3d renderer
    this.r0 = {
      domClass: 'r0',
      domElement: null,
      renderer: null,
      color: 0x212121,
      targetID: 0,
      camera: null,
      controls: null,
      scene: null,
      light: null,
    };

    // 2d axial renderer
    this.r1 = {
      domClass: 'r1',
      domElement: null,
      renderer: null,
      color: 0x121212,
      sliceOrientation: 'axial',
      sliceColor: 0xff1744,
      targetID: 1,
      camera: null,
      controls: null,
      scene: null,
      light: null,
      stackHelper: null,
      localizerHelper: null,
      localizerScene: null,
    };

    // 2d sagittal renderer
    this.r2 = {
      domClass: 'r2',
      domElement: null,
      renderer: null,
      color: 0x121212,
      sliceOrientation: 'sagittal',
      sliceColor: 0xffea00,
      targetID: 2,
      camera: null,
      controls: null,
      scene: null,
      light: null,
      stackHelper: null,
      localizerHelper: null,
      localizerScene: null,
    };

    // 2d coronal renderer
    this.r3 = {
      domClass: 'r3',
      domElement: null,
      renderer: null,
      color: 0x121212,
      sliceOrientation: 'coronal',
      sliceColor: 0x76ff03,
      targetID: 3,
      camera: null,
      controls: null,
      scene: null,
      light: null,
      stackHelper: null,
      localizerHelper: null,
      localizerScene: null,
    };

    this.changeMode = this.changeMode.bind(this);
    this.changeOrientation = this.changeOrientation.bind(this);
    this.download = this.download.bind(this);
    this.restore = this.restore.bind(this);
    this.fullScreen = this.fullScreen.bind(this);
    this.containerRef = React.createRef();
  }

  extractFilesPath (data) {
    let files;
    if (data !== undefined) {
      if (data.getMetaType === undefined) {
        files = data;
      } else if (data.getMetaType() === 'Instance') {
        if (data.getVariable().getInitialValues()[0].value.format === 'NIFTI') {
          files = data.getVariable().getInitialValues()[0].value.data;
        } else if (
          data.getVariable().getInitialValues()[0].value.format === 'DCM'
        ) {
          // todo: What do we do here?
        }
      }
    }
    return files;
  }

  loadModel () {
    if (this.state.files !== undefined && null != this.state.files) {
      this.ready = false;
      const _this = this;

      /**
       * Init the quadview
       */
      function init () {
        /**
         * Called on each animation frame
         */
        function animate () {
          // we are ready when both meshes have been loaded
          if (_this.ready) {
            if (
              (_this.state.mode === 'single_view'
                && _this.state.orientation === '3d')
              || _this.state.mode === 'quad_view'
            ) {
              // render
              _this.r0.controls.update();
              _this.r0.light.position.copy(_this.r0.camera.position);
              _this.r0.renderer.render(_this.r0.scene, _this.r0.camera);
            }

            if (
              (_this.state.mode === 'single_view'
                && _this.state.orientation === 'sagittal')
              || _this.state.mode === 'quad_view'
            ) {
              _this.r1.controls.update();
              // r1
              _this.r1.renderer.clear();
              _this.r1.renderer.render(_this.r1.scene, _this.r1.camera);

              // localizer
              _this.r1.renderer.clearDepth();
              _this.r1.renderer.render(
                _this.r1.localizerScene,
                _this.r1.camera
              );
            }

            if (
              (_this.state.mode === 'single_view'
                && _this.state.orientation === 'axial')
              || _this.state.mode === 'quad_view'
            ) {
              _this.r2.controls.update();
              // r2
              _this.r2.renderer.clear();
              _this.r2.renderer.render(_this.r2.scene, _this.r2.camera);
              // localizer
              _this.r2.renderer.clearDepth();
              _this.r2.renderer.render(
                _this.r2.localizerScene,
                _this.r2.camera
              );
            }

            if (
              (_this.state.mode === 'single_view'
                && _this.state.orientation === 'coronal')
              || _this.state.mode === 'quad_view'
            ) {
              _this.r3.controls.update();
              // r3
              _this.r3.renderer.clear();
              _this.r3.renderer.render(_this.r3.scene, _this.r3.camera);
              // localizer
              _this.r3.renderer.clearDepth();
              _this.r3.renderer.render(
                _this.r3.localizerScene,
                _this.r3.camera
              );
            }
          }

          // request new frame
          requestAnimationFrame(function () {
            animate();
          });
        }

        // renderers
        DicomViewerUtils.initRenderer3D(_this.r0, _this.containerRef.current);
        DicomViewerUtils.initRenderer2D(_this.r1, _this.containerRef.current);
        DicomViewerUtils.initRenderer2D(_this.r2, _this.containerRef.current);
        DicomViewerUtils.initRenderer2D(_this.r3, _this.containerRef.current);

        // start rendering loop
        animate();
      }

      // init threeJS
      init();

      /*
       * load sequence for each file
       * instantiate the loader
       * it loads and parses the dicom image
       */
      let loader = new VolumeLoader();
      loader
        .load(this.state.files)
        .then(function () {
          let series = loader.data[0].mergeSeries(loader.data)[0];
          loader.free();
          loader = null;
          // get first stack from series
          let stack = series.stack[0];
          stack.prepare();

          // center 3d camera/control on the stack
          let centerLPS = stack.worldCenter();
          _this.r0.camera.lookAt(centerLPS.x, centerLPS.y, centerLPS.z);
          _this.r0.camera.updateProjectionMatrix();
          _this.r0.controls.target.set(centerLPS.x, centerLPS.y, centerLPS.z);

          // bouding box
          let boxHelper = new HelpersBoundingBox(stack);
          _this.r0.scene.add(boxHelper);

          // red slice
          DicomViewerUtils.initHelpersStack(_this.r1, stack);
          _this.r0.scene.add(_this.r1.scene);

          // yellow slice
          DicomViewerUtils.initHelpersStack(_this.r2, stack);
          _this.r0.scene.add(_this.r2.scene);

          // green slice
          DicomViewerUtils.initHelpersStack(_this.r3, stack);
          _this.r0.scene.add(_this.r3.scene);

          // create new mesh with Localizer shaders
          let plane1 = _this.r1.stackHelper.slice.cartesianEquation();
          let plane2 = _this.r2.stackHelper.slice.cartesianEquation();
          let plane3 = _this.r3.stackHelper.slice.cartesianEquation();

          // localizer red slice
          DicomViewerUtils.initHelpersLocalizer(_this.r1, stack, plane1, [
            {
              plane: plane2,
              color: new THREE.Color(_this.r2.stackHelper.borderColor),
            },
            {
              plane: plane3,
              color: new THREE.Color(_this.r3.stackHelper.borderColor),
            },
          ]);

          // localizer yellow slice
          DicomViewerUtils.initHelpersLocalizer(_this.r2, stack, plane2, [
            {
              plane: plane1,
              color: new THREE.Color(_this.r1.stackHelper.borderColor),
            },
            {
              plane: plane3,
              color: new THREE.Color(_this.r3.stackHelper.borderColor),
            },
          ]);

          // localizer green slice
          DicomViewerUtils.initHelpersLocalizer(_this.r3, stack, plane3, [
            {
              plane: plane1,
              color: new THREE.Color(_this.r1.stackHelper.borderColor),
            },
            {
              plane: plane2,
              color: new THREE.Color(_this.r2.stackHelper.borderColor),
            },
          ]);

          _this.configureEvents();
          _this.ready = true;
        })
        .catch(function (error) {
          window.console.log('oops... something went wrong...');
          window.console.log(error);
        });
    }
  }

  configureEvents () {
    const _this = this;

    function goToPoint (event) {
      const canvas = event.srcElement.parentElement;
      const id = event.target.id;
      const mouse = {
        x: ((event.clientX - offset(canvas).left) / canvas.clientWidth) * 2 - 1,
        y:
          -((event.clientY - offset(canvas).top) / canvas.clientHeight) * 2 + 1,
      };

      let camera = null;
      let stackHelper = null;
      let scene = null;
      switch (id) {
      case '0':
        camera = _this.r0.camera;
        stackHelper = _this.r1.stackHelper;
        scene = _this.r0.scene;
        break;
      case '1':
        camera = _this.r1.camera;
        stackHelper = _this.r1.stackHelper;
        scene = _this.r1.scene;
        break;
      case '2':
        camera = _this.r2.camera;
        stackHelper = _this.r2.stackHelper;
        scene = _this.r2.scene;
        break;
      case '3':
        camera = _this.r3.camera;
        stackHelper = _this.r3.stackHelper;
        scene = _this.r3.scene;
        break;
      }

      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(mouse, camera);

      const intersects = raycaster.intersectObjects(scene.children, true);
      if (intersects.length > 0) {
        let ijk = StackModel.worldToData(
          stackHelper.stack,
          intersects[0].point
        );
        _this.r1.stackHelper.index = ijk.getComponent(
          (_this.r1.stackHelper.orientation + 2) % 3
        );
        _this.r2.stackHelper.index = ijk.getComponent(
          (_this.r2.stackHelper.orientation + 2) % 3
        );
        _this.r3.stackHelper.index = ijk.getComponent(
          (_this.r3.stackHelper.orientation + 2) % 3
        );

        DicomViewerUtils.updateLocalizer(_this.r2, [
          _this.r1.localizerHelper,
          _this.r3.localizerHelper,
        ]);
        DicomViewerUtils.updateLocalizer(_this.r1, [
          _this.r2.localizerHelper,
          _this.r3.localizerHelper,
        ]);
        DicomViewerUtils.updateLocalizer(_this.r3, [
          _this.r1.localizerHelper,
          _this.r2.localizerHelper,
        ]);
      }
    }

    function goToSingleView (event) {
      const id = event.target.id;
      let orientation = null;
      switch (id) {
      case '0':
        orientation = '3d';
        break;
      case '1':
        orientation = 'sagittal';
        break;
      case '2':
        orientation = 'axial';
        break;
      case '3':
        orientation = 'coronal';
        break;
      }

      if (orientation != null) {
        _this.setState({ mode: 'single_view', orientation: orientation });
      }
    }

    function togglMode (event) {
      if (_this.state.mode === 'single_view') {
        _this.changeMode();
      } else {
        goToSingleView(event);
      }
    }

    function onScroll (event) {
      const id = event.target.domElement.id;
      let stackHelper = null;
      switch (id) {
      case 'r1':
        stackHelper = _this.r1.stackHelper;
        break;
      case 'r2':
        stackHelper = _this.r2.stackHelper;
        break;
      case 'r3':
        stackHelper = _this.r3.stackHelper;
        break;
      }

      if (event.delta > 0) {
        if (stackHelper.index >= stackHelper.orientationMaxIndex - 1) {
          return false;
        }
        stackHelper.index += 1;
      } else {
        if (stackHelper.index <= 0) {
          return false;
        }
        stackHelper.index -= 1;
      }

      DicomViewerUtils.updateLocalizer(_this.r2, [
        _this.r1.localizerHelper,
        _this.r3.localizerHelper,
      ]);
      DicomViewerUtils.updateLocalizer(_this.r1, [
        _this.r2.localizerHelper,
        _this.r3.localizerHelper,
      ]);
      DicomViewerUtils.updateLocalizer(_this.r3, [
        _this.r1.localizerHelper,
        _this.r2.localizerHelper,
      ]);
    }

    function performEventAction (action, event) {
      // Check if it is a already defined action or a external one
      if (
        action === 'goToPoint'
        || action === 'goToSingleView'
        || action === 'togglMode'
      ) {
        eval(action + '(event)');
      } else {
        action(event, this);
      }
    }

    function eventHandling (event) {
      if (event.type === 'click' && _this.props.onClick !== undefined) {
        performEventAction(_this.props.onClick, event);
      } else if (
        event.type === 'click'
        && (event.ctrlKey || event.metaKey)
        && _this.props.onCtrlClick !== undefined
      ) {
        performEventAction(_this.props.onCtrlClick, event);
      } else if (
        event.type === 'click'
        && event.shiftKey
        && _this.props.onShiftClick !== undefined
      ) {
        performEventAction(_this.props.onShiftClick, event);
      } else if (
        event.type === 'dblclick'
        && _this.props.onDoubleClick !== undefined
      ) {
        performEventAction(_this.props.onDoubleClick, event);
      }
    }

    // event listeners ondoubleclick
    _this.r0.domElement.addEventListener('dblclick', eventHandling);
    _this.r1.domElement.addEventListener('dblclick', eventHandling);
    _this.r2.domElement.addEventListener('dblclick', eventHandling);
    _this.r3.domElement.addEventListener('dblclick', eventHandling);

    // event listeners onclick
    this.r0.domElement.addEventListener('click', eventHandling);
    this.r1.domElement.addEventListener('click', eventHandling);
    this.r2.domElement.addEventListener('click', eventHandling);
    this.r3.domElement.addEventListener('click', eventHandling);

    // event listeners on scrol
    this.r1.controls.addEventListener('OnScroll', onScroll);
    this.r2.controls.addEventListener('OnScroll', onScroll);
    this.r3.controls.addEventListener('OnScroll', onScroll);
  }

  setQuadLayout () {
    // update 3D
    DicomViewerUtils.windowResize3D(this.r0);

    // update 2d
    DicomViewerUtils.windowResize2D(this.r1);
    DicomViewerUtils.windowResize2D(this.r2);
    DicomViewerUtils.windowResize2D(this.r3);
  }

  setSingleLayout () {
    let rendererObj;
    switch (this.state.orientation) {
    case '3d':
      rendererObj = this.r0;
      break;
    case 'sagittal':
      rendererObj = this.r1;
      break;
    case 'axial':
      rendererObj = this.r2;
      break;
    case 'coronal':
      rendererObj = this.r3;
      break;
    }

    if (this.state.orientation === '3d') {
      DicomViewerUtils.windowResize3D(rendererObj);
    } else {
      DicomViewerUtils.windowResize2D(rendererObj);
    }
  }

  setLayout () {
    if (this.state.mode === 'single_view') {
      this.setSingleLayout();
    } else {
      this.setQuadLayout();
    }
  }

  componentWillUnmount () {
    DicomViewerUtils.dispose(this.r0);
    DicomViewerUtils.dispose(this.r1);
    DicomViewerUtils.dispose(this.r2);
    DicomViewerUtils.dispose(this.r3);
  }

  componentDidMount () {
    this.loadModel();
  }

  componentDidUpdate (prevProps, prevState, snapshot) {
    if (prevState.files !== this.state.files) {
      this.loadModel();
    } else {
      this.setLayout();
    }
  }

  changeMode () {
    if (this.state.mode === 'single_view') {
      this.setState({ mode: 'quad_view' });
    } else {
      this.setState({ mode: 'single_view' });
    }
  }

  changeOrientation () {
    let newOrientation;
    switch (this.state.orientation) {
    case 'coronal':
      newOrientation = 'sagittal';
      break;
    case 'sagittal':
      newOrientation = 'axial';
      break;
    case 'axial':
      newOrientation = '3d';
      break;
    case '3d':
      newOrientation = 'coronal';
      break;
    default:
      break;
    }
    this.setState({ orientation: newOrientation });
  }

  download () {
    createZipFromRemoteFiles(this.state.files, 'data.zip');
  }

  restore () {
    this.setState({ fullScreen: false });
  }

  fullScreen () {
    this.setState({ fullScreen: true });
  }

  getCustomButtons () {
    const customButtons = [];

    if (this.state.mode === 'single_view') {
      customButtons.push({
        icon: faThLarge,
        id: 'Multi View',
        tooltip: 'Multi View',
        action: this.changeMode,
      });
      customButtons.push({
        icon: faExchangeAlt,
        id: 'Change Orientation',
        tooltip: 'Change Orientation',
        action: this.changeOrientation,
      });
    } else {
      customButtons.push({
        icon: faSquare,
        id: 'Single View',
        tooltip: 'Single View',
        action: this.changeMode,
      });
    }

    if (this.props.showDownloadButton) {
      customButtons.push({
        icon: faDownload,
        id: 'Download',
        tooltip: 'Download',
        action: this.download,
      });
    }

    if (this.state.fullScreen) {
      customButtons.push({
        icon: faCompressAlt,
        id: 'Restore',
        tooltip: 'Restore',
        action: this.restore,
      });
    } else {
      customButtons.push({
        icon: faExpandAlt,
        id: 'Maximize',
        tooltip: 'Maximize',
        action: this.fullScreen,
      });
    }

    return customButtons;
  }

  render () {
    const { classes } = this.props;
    const { fullScreen } = this.state;
    const customButtons = this.getCustomButtons();

    const containerStyle = fullScreen
      ? {
        position: 'fixed',
        top: '0',
        left: '0',
        zIndex: '9999',
        background: '#121212',
        height: '100%',
        width: '100%',
      }
      : {
        height: '100%',
        width: '100%',
      };

    return (
      <div
        ref={this.containerRef}
        key={this.props.id + '_component'}
        id={this.props.id + '_component'}
        style={containerStyle}
      >
        <CustomToolbar buttons={customButtons} />
        <div
          className={classes.dicomViewer}
          style={{ height: '90%', width: '100%' }}
        >
          <div
            id="r0"
            className={classes.renderer + ' r0'}
            style={{
              display:
                this.state.mode === 'single_view'
                && this.state.orientation !== '3d'
                  ? 'none'
                  : '',
              width:
                this.state.mode === 'single_view'
                && this.state.orientation === '3d'
                  ? '100%'
                  : '50%',
              height:
                this.state.mode === 'single_view'
                && this.state.orientation === '3d'
                  ? '100%'
                  : '50%',
            }}
          />
          <div
            id="r1"
            className={classes.renderer + ' r1'}
            style={{
              display:
                this.state.mode === 'single_view'
                && this.state.orientation !== 'sagittal'
                  ? 'none'
                  : '',
              width:
                this.state.mode === 'single_view'
                && this.state.orientation === 'sagittal'
                  ? '100%'
                  : '50%',
              height:
                this.state.mode === 'single_view'
                && this.state.orientation === 'sagittal'
                  ? '100%'
                  : '50%',
            }}
          />
          <div
            id="r2"
            className={classes.renderer + ' r2'}
            style={{
              display:
                this.state.mode === 'single_view'
                && this.state.orientation !== 'axial'
                  ? 'none'
                  : '',
              width:
                this.state.mode === 'single_view'
                && this.state.orientation === 'axial'
                  ? '100%'
                  : '50%',
              height:
                this.state.mode === 'single_view'
                && this.state.orientation === 'axial'
                  ? '100%'
                  : '50%',
            }}
          />
          <div
            id="r3"
            className={classes.renderer + ' r3'}
            style={{
              display:
                this.state.mode === 'single_view'
                && this.state.orientation !== 'coronal'
                  ? 'none'
                  : '',
              width:
                this.state.mode === 'single_view'
                && this.state.orientation === 'coronal'
                  ? '100%'
                  : '50%',
              height:
                this.state.mode === 'single_view'
                && this.state.orientation === 'coronal'
                  ? '100%'
                  : '50%',
            }}
          />
        </div>
      </div>
    );
  }
}

DicomViewer.propTypes = {
  /**
   * Component identifier
   */
  id: PropTypes.string.isRequired,
  /**
   * Path/URL to file (f.e. "/path/to/my/file.gz")
   */
  data: PropTypes.string.isRequired,
  /**
   * Initial view mode: 'single_view' or 'quad_view'
   */
  mode: PropTypes.string,
  /**
   * Initial orientation view: 'coronal', 'axial' or 'sagital'
   */
  orientation: PropTypes.string,
  /**
   * Action to performe on click: 'goToPoint', 'goToSingleView', 'togglMode', or other
   */
  onClick: PropTypes.any,
  /**
   * Action to performe on Ctrl click: 'goToPoint', 'goToSingleView', 'togglMode', or other
   */
  onCtrlClick: PropTypes.any,
  /**
   * Action to performe on Shift click: 'goToPoint', 'goToSingleView', 'togglMode', or other
   */
  onShiftClick: PropTypes.any,
  /**
   * Action to performe on double click: 'goToPoint', 'goToSingleView', 'togglMode', or other
   */
  onDoubleClick: PropTypes.any,
  /**
   * Bool that defines the showing or not of the download button
   */
  showDownloadButton: PropTypes.bool,
};

export default withStyles(styles)(DicomViewer);
