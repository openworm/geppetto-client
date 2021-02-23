import React, { Component } from 'react';
import { withStyles } from '@material-ui/core';
import Canvas from '../../Canvas';
import CameraControls from '../../../camera-controls/CameraControls';
import Loader from "@geppettoengine/geppetto-ui/loader/Loader";
import Button from "@material-ui/core/Button";

const INSTANCE_NAME = 'acnet2';
const COLORS = [
  { r: 0, g: 0.2, b: 0.6, a: 1 },
  { r: 0.8, g: 0, b: 0, a: 1 },
  { r: 0, g: 0.8, b: 0, a: 1 },
  { r: 0, g: 0.8, b: 0, a: 0.5 },
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

class AuditoryCortexExample extends Component {
  constructor (props) {
    super(props);
    this.canvasRef = React.createRef();
    this.state = {
      hasModelLoaded: false,
      showLoader: true,
      data: [
        {
          instancePath: 'acnet2.baskets_12',
          color: COLORS[1],
        },
        { instancePath: 'acnet2' },
        {
          instancePath: 'acnet2.baskets_12[0]',
          color: COLORS[2],
        },
        {
          instancePath: 'acnet2.baskets_12[7]',
          color: COLORS[3],
        },
      ],
      selected: {},
      cameraOptions: {
        angle: 60,
        near: 10,
        far: 2000000,
        baseZoom: 1,
        cameraControls: {
          instance: CameraControls,
          props: { wireframeButtonEnabled: false, }
        },
        incrementPan: {
          x: 0.01,
          y: 0.01
        },
        incrementRotation: {
          x: 0.01,
          y: 0.01,
          z: 0.01,
        },
        incrementZoom: 0.1,
        reset: false,
        movieFilter: false,
        autorotate: false,
        wireframe: false,
        position: { x: 230.357, y: 256.435, z: 934.238 },
        rotation: { rx: -0.294, ry: -0.117, rz: -0.02, radius: 531.19 },
        flip: []
      },
    };

    this.lastCameraUpdate = null;
    this.cameraHandler = this.cameraHandler.bind(this);
    this.selectionHandler = this.selectionHandler.bind(this);
    this.hoverHandler = this.hoverHandler.bind(this);
    this.handleClickOutside = this.handleClickOutside.bind(this);
    this.handleToggle = this.handleToggle.bind(this);

  }

  componentDidMount () {
    import(/* webpackChunkName: "acnet_model.json" */'./acnet_model.json').then(model => {
      GEPPETTO.Manager.loadModel(model);
      Instances.getInstance(INSTANCE_NAME);
      this.setState({ hasModelLoaded: true, showLoader: false })
      document.addEventListener('mousedown', this.handleClickOutside);
    })
  }
  
  componentWillUnmount () {
    document.removeEventListener('mousedown', this.handleClickOutside);
  }
  
  handleClickOutside (event) {

    if (this.node && !this.node.contains(event.target)) {
      this.setState({ hasModelLoaded: false })
    }
  }

  handleToggle () {
    this.setState({ showLoader: true })

    import(/* webpackChunkName: "acnet_model.json" */'./acnet_model.json').then(model => {
      GEPPETTO.Manager.loadModel(model);
      Instances.getInstance(INSTANCE_NAME);
      this.setState({ hasModelLoaded: true, showLoader: false })
    })
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
                  newSelected[path] = { [geometryIdentifier]: { color: instance.visualGroups.custom[geometryIdentifier].color, }, };
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

  hoverHandler (obj) {
  }

  render () {
    const { classes } = this.props;
    const { data, cameraOptions, hasModelLoaded, showLoader } = this.state;

    let camOptions = cameraOptions;
    if (this.lastCameraUpdate) {
      camOptions = {
        ...cameraOptions,
        position: this.lastCameraUpdate.position,
        rotation: this.lastCameraUpdate.rotation,
      };
    }

    return showLoader ? <Loader active={true}/> : hasModelLoaded ? (
      <div ref={node => this.node = node} className={classes.container}>
        <Canvas
          ref={this.canvasRef}
          data={data}
          cameraOptions={camOptions}
          cameraHandler={this.cameraHandler}
          selectionHandler={this.selectionHandler}
          backgroundColor={0x505050}
          hoverListeners={[this.hoverHandler]}
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

export default withStyles(styles)(AuditoryCortexExample);
