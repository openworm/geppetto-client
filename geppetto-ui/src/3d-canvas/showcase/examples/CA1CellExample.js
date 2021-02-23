import React, { Component } from 'react';
import { withStyles } from '@material-ui/core';
import Canvas from '../../Canvas';
import CameraControls from '../../../camera-controls/CameraControls';
import Button from "@material-ui/core/Button";
import Loader from "@geppettoengine/geppetto-ui/loader/Loader";

const INSTANCE_NAME = 'network_CA1PyramidalCell';
const COLORS = [
  { r: 0, g: 0.29, b: 0.71, a: 1 },
  { r: 0.43, g: 0.57, b: 0, a: 1 },
  { r: 1, g: 0.41, b: 0.71, a: 1 },
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
class CA1Example extends Component {
  constructor (props) {
    super(props);
    this.canvasRef = React.createRef();

    this.state = {
      showLoader: false,
      hasModelLoaded: false,
      data: [
        {
          instancePath: 'network_CA1PyramidalCell.CA1_CG[0]',
          visualGroups: {
            index: 0,
            custom: {
              soma_group: { color: COLORS[0], },
              dendrite_group: { color: COLORS[1], },
              axon_group: { color: COLORS[2], },
            },
          },
        },
      ],
      selected: {},
      cameraOptions: {
        angle: 60,
        near: 10,
        far: 2000000,
        baseZoom: 1,
        position: { x: -97.349, y: 53.797, z: 387.82 },
        rotation: { rx: 0.051, ry: -0.192, rz: -0.569, radius: 361.668 },
        autoRotate: false,
        movieFilter: true,
        reset: false,
        cameraControls: { 
          instance: CameraControls,
          props: { wireframeButtonEnabled: false, }
        },
        incrementPan: {
          x:0.01,
          y:0.01
        },
        incrementRotation: {
          x:0.01,
          y:0.01,
          z:0.01,
        },
        incrementZoom: 0.1,
        wireframe:false,
        flip:[],
      },
    };

    this.lastCameraUpdate = null;
    this.cameraHandler = this.cameraHandler.bind(this);
    this.selectionHandler = this.selectionHandler.bind(this);
    this.handleClickOutside = this.handleClickOutside.bind(this);
    this.handleToggle = this.handleToggle.bind(this);
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
      if (instance.instancePath == path) {
        if (geometryIdentifier == '') {
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
    import(/* webpackChunkName: "ca1_model.json" */'./ca1_model.json').then(model => {
      GEPPETTO.Manager.loadModel(model);
      Instances.getInstance(INSTANCE_NAME);
      this.setState({ hasModelLoaded: true, showLoader:false })
    })
  }

  render () {
    const { classes } = this.props;
    const { data, cameraOptions, showLoader, hasModelLoaded } = this.state;

    let camOptions = cameraOptions;
    if (this.lastCameraUpdate) {
      camOptions = {
        ...cameraOptions,
        position: this.lastCameraUpdate.position,
        rotation: {
          ...this.lastCameraUpdate.rotation,
          radius: cameraOptions.rotation.radius,
        },
      };
    }

    return showLoader ? <Loader active={true}/>
      : hasModelLoaded ? (
        <div ref={node => this.node = node} className={classes.container}>
          <Canvas
            ref={this.canvasRef}
            data={data}
            cameraOptions={camOptions}
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

export default withStyles(styles)(CA1Example);
