import React, { Component } from 'react';
import { withStyles } from '@material-ui/core';
import Canvas from '../../Canvas';
import CameraControls from '../../../camera-controls/CameraControls';
import * as THREE from 'three';
import Loader from "@geppettoengine/geppetto-ui/loader/Loader";
import Button from "@material-ui/core/Button";

const INSTANCES = [
  'VFB_00017894',
  'VFB_00030624',
  'VFB_00030622',
  'VFB_00030616',
  'VFB_00030633',
  'VFB_00030840',
  'VFB_00030632',
  'VFB_00030783',
];
const COLORS = [
  { r: 0.36, g: 0.36, b: 0.36, a: 1 },
  { r: 0, g: 1, b: 0, a: 1 },
  { r: 1, g: 0, b: 1, a: 1 },
  { r: 0, g: 0, b: 1, a: 1 },
  { r: 1, g: 0.83, b: 0, a: 1 },
  { r: 0, g: 0.52, b: 0.96, a: 1 },
  { r: 1, g: 0, b: 0, a: 1 },
];

const SELECTION_COLOR = { r: 0.8, g: 0.8, b: 0, a: 1 };

const styles = () => ({
  container: {
    height: '800px',
    width: '1240px',
    display: 'flex',
    alignItems: 'stretch',
  },
});
class VFBExample extends Component {
  constructor (props) {
    super(props);
    this.canvasRef = React.createRef();
    this.state = {
      showLoader: false,
      hasModelLoaded: false,
      data: [
        {
          instancePath: 'VFB_00017894',
          color: COLORS[0],
        },
        {
          instancePath: 'VFB_00030622',
          color: COLORS[1],
        },
        {
          instancePath: 'VFB_00030616',
          color: COLORS[2],
        },
        {
          instancePath: 'VFB_00030633',
          color: COLORS[3],
        },
        {
          instancePath: 'VFB_00030840',
          color: COLORS[4],
        },
        {
          instancePath: 'VFB_00030632',
          color: COLORS[5],
        },
        { instancePath: 'VFB_00030624', },
        {
          instancePath: 'VFB_00030783',
          color: COLORS[6],
        },
      ],
      selected: {},
      threeDObjects: [],
      modelVersion:0
    };

    this.cameraOptions = {
      position: { x: 319.7, y: 153.12, z: -494.2 },
      rotation: { rx: -3.14, ry: 0, rz: -3.14, radius: 559.83 },
      cameraControls: { 
        instance: CameraControls,
        props: { wireframeButtonEnabled: true, }
      },
      flip: ['y', 'z'],
      rotateSpeed: 3,
    }

    this.lastCameraUpdate = null;
    this.cameraHandler = this.cameraHandler.bind(this);
    this.selectionHandler = this.selectionHandler.bind(this);
    this.onMount = this.onMount.bind(this);
    this.handleToggle = this.handleToggle.bind(this);
    this.handleClickOutside = this.handleClickOutside.bind(this);
  }

  componentDidMount () {
    document.addEventListener('mousedown', this.handleClickOutside);
  }
  componentWillUnmount () {
    document.removeEventListener('mousedown', this.handleClickOutside);
  }
  handleClickOutside (event) {
    if (this.node && !this.node.contains(event.target)) {
      if (event.offsetX <= event.target.clientWidth){
        this.setState({ hasModelLoaded: false })
      }
    }
  }

  /**
   * Add a 3D plane to the scene at the given coordinates (4) points.
   * It could be any geometry really.
   * @returns {THREE.Mesh}
   */
  get3DPlane (x1, y1, z1, x2, y2, z2, x3, y3, z3, x4, y4, z4) {

    const geometry = new THREE.Geometry();
    geometry.vertices.push(
      new THREE.Vector3(x1, y1, z1),// vertex0
      new THREE.Vector3(x2, y2, z2),// 1
      new THREE.Vector3(x3, y3, z3),// 2
      new THREE.Vector3(x4, y4, z4)// 3
    );
    geometry.faces.push(
      new THREE.Face3(2, 1, 0),// use vertices of rank 2,1,0
      new THREE.Face3(3, 1, 2)// vertices[3],1,2...
    );
    geometry.computeBoundingBox();

    const max = geometry.boundingBox.max,
      min = geometry.boundingBox.min;
    const offset = new THREE.Vector2(0 - min.x, 0 - min.y);
    const range = new THREE.Vector2(max.x - min.x, max.y - min.y);
    const faces = geometry.faces;

    geometry.faceVertexUvs[0] = [];

    for (let i = 0; i < faces.length; i++) {

      const v1 = geometry.vertices[faces[i].a],
        v2 = geometry.vertices[faces[i].b],
        v3 = geometry.vertices[faces[i].c];

      geometry.faceVertexUvs[0].push([
        new THREE.Vector2((v1.x + offset.x) / range.x, (v1.y + offset.y) / range.y),
        new THREE.Vector2((v2.x + offset.x) / range.x, (v2.y + offset.y) / range.y),
        new THREE.Vector2((v3.x + offset.x) / range.x, (v3.y + offset.y) / range.y)
      ]);
    }
    geometry.uvsNeedUpdate = true;
    geometry.dynamic = true;

    const material = new THREE.MeshBasicMaterial({ side: THREE.DoubleSide });
    material.nowireframe = true;
      
    material.opacity = 0.3;
    material.transparent = true;
    material.color.setHex("0xb0b0b0");

    const mesh = new THREE.Mesh(geometry, material);
    mesh.renderOrder = 1;
    mesh.clickThrough = true;
    return mesh;
  }

  onMount (scene) {
    const bb = new THREE.Box3().setFromObject(scene);
    const plane = this.get3DPlane(bb.min.x, bb.min.y, bb.min.z, bb.max.x, bb.max.y, bb.max.z)
    const axesHelper = new THREE.AxesHelper( 100 );
    scene.add( axesHelper );
    this.setState(() => ({ threeDObjects: [plane] }));

  }

  cameraHandler (obj) {
    this.lastCameraUpdate = obj;
  }

  selectionHandler (selectedMap) {
    const { data, selected } = this.state;
    let path;
    for (let sk in selectedMap) {
      const sv = selectedMap[sk];
      if (sv.distanceIndex === 0) {
        path = sk;
      }
    }
    const currentColor = selectedMap[path].object.material.color;
    const geometryIdentifier = selectedMap[path].geometryIdentifier;
    const newData = data;
    const newSelected = selected;
    let done = false;
    for (const instance of newData) {
      if (instance.instancePath === path) {
        if (geometryIdentifier === '') {
          if (path in newSelected) {
            instance.color = newSelected[path].color;
            delete newSelected[path];
          } else {
            newSelected[path] = { color: instance.color };
            instance.color = SELECTION_COLOR;
          }
          done = true;
        } else {
          if (path in newSelected) {
            if (geometryIdentifier in newSelected[path]) {
              instance.visualGroups.custom[geometryIdentifier].color
                = newSelected[path][geometryIdentifier].color;
              delete newSelected[path][geometryIdentifier];
              if (Object.keys(newSelected[path]).length === 0) {
                delete newSelected[path];
              }
              done = true;
            } else {
              if (instance.visualGroups.custom[geometryIdentifier]) {
                newSelected[path][geometryIdentifier] = { color: instance.visualGroups.custom[geometryIdentifier].color, };
                instance.visualGroups.custom[
                  geometryIdentifier
                ].color = SELECTION_COLOR;
                done = true;
              }
            }
          } else {
            if (instance.visualGroups) {
              if (instance.visualGroups.custom) {
                if (instance.visualGroups.custom[geometryIdentifier]) {
                  newSelected[path] = {
                    [geometryIdentifier]: {
                      color:
                        instance.visualGroups.custom[geometryIdentifier].color,
                    },
                  };
                  instance.visualGroups.custom[
                    geometryIdentifier
                  ].color = SELECTION_COLOR;
                  done = true;
                } else {
                  newSelected[path] = { [geometryIdentifier]: { color: { ...currentColor, }, }, };
                  instance.visualGroups.custom[geometryIdentifier] = { color: SELECTION_COLOR, };
                  done = true;
                }
              } else {
                newSelected[path] = { [geometryIdentifier]: { color: { ...currentColor, }, }, };
                instance.visualGroups.custom = { [geometryIdentifier]: { color: SELECTION_COLOR }, };
                done = true;
              }
            }
          }
        }
      }
    }
    if (!done) {
      newData.push({
        instancePath: path,
        color: SELECTION_COLOR,
      });
      newSelected[path] = { color: { ...currentColor } };
    }

    this.setState(() => ({ data: newData, selected: newSelected }));
  }

  handleToggle () {
    this.setState({ showLoader: true })

    import(/* webpackChunkName: "vfb_model.json" */'./vfb_model.json').then(model => {
      GEPPETTO.Manager.loadModel(model);
      for (const iname of INSTANCES) {
        Instances.getInstance(iname);
      }
      this.setState({ hasModelLoaded: true, showLoader: false })
    })
  }

  render () {
    const { classes } = this.props;
    const { data, threeDObjects, modelVersion, hasModelLoaded, showLoader } = this.state;

    let camOptions = this.cameraOptions;
    if (this.lastCameraUpdate) {
      camOptions = {
        ...this.cameraOptions,
        position: this.lastCameraUpdate.position,
        rotation: this.lastCameraUpdate.rotation,
      };
    }

    return showLoader ? <Loader active={true}/> : hasModelLoaded ? (
      <div ref={node => this.node = node} className={classes.container}>
        <Canvas
          ref={this.canvasRef}
          modelVersion={modelVersion}
          data={data}
          threeDObjects={threeDObjects}
          cameraOptions={camOptions}
          onMount={this.onMount}
          cameraHandler={this.cameraHandler}
          selectionHandler={this.selectionHandler}
          linesThreshold={10000}
          backgroundColor={0x505050}
        />
      </div>
    ) : <Button
      variant="outlined"
      color="primary"
      onClick={this.handleToggle}
    >
      Show Example
    </Button>
  }
}

export default withStyles(styles)(VFBExample);
