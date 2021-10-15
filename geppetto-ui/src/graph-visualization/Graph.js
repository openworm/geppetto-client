import React, { Component } from 'react'
import ReactDOM from 'react-dom'
import PropTypes from 'prop-types';
import * as d3 from 'd3-force-3d'
import * as THREE from 'three'
import ForceGraph2D from 'react-force-graph-2d';
import ForceGraph3D from 'react-force-graph-3d';

import { splitter, getDarkerColor } from './utils'

export default class GeppettoGraphVisualization extends Component {

  // Ref to GGV container
  ggv = React.createRef()

  dimensions = { width: 200, height: 200 }

  font = this.props.font || "6px Source Sans Pro"
  size = this.props.nodeRelSize || 20
  borderSize = Math.floor((this.props.nodeRelSize || 20) * 0.1)

  // Gap to leave between lines in text inside nodes in 2D graphs
  doubleGap = Math.floor((this.props.nodeRelSize || 20) * 0.25)
  tripleGap = Math.floor((this.props.nodeRelSize || 20) * 0.35)
  
  timeToCenter2DCamera = this.props.timeToCenter2DCamera || 0

  getNodeLabel = this.props.nodeLabel ? this.fnOrField(this.props.nodeLabel) : node => node.name
  getLinkLabel = this.props.linkLabel ? this.fnOrField(this.props.linkLabel) : link => link.name
  getLinkWidth = this.props.linkWidth ? this.props.linkWidth instanceof Function ? this.props.linkWidth : () => this.props.linkWidth : () => 0.25
  getLinkColor = this.props.linkColor ? this.props.linkColor instanceof Function ? this.props.linkColor : () => this.props.linkColor : () => 'white'
  getNodeColor = this.props.nodeColor ? this.props.nodeColor instanceof Function ? this.props.nodeColor : () => this.props.nodeColor : () => '#6520ff'
  getNodeLabelColor = this.props.nodeLabelColor ? this.props.nodeLabelColor instanceof Function ? this.props.nodeLabelColor : () => this.props.nodeLabelColor : () => '#ffffff'

  componentDidMount (){
    const { data, url } = this.props

    if (this.props.d2) {
      const forceLinkDistance = this.props.forceLinkDistance || 90
      const forceLinkStrength = this.props.forceLinkStrength || 0.7
      const forceChargeStrength = this.props.forceChargeStrength || -200
      const collideSize = this.props.collideSize || this.size * 1.5
      this.ggv.current.d3Force('collide', d3.forceCollide(collideSize));
      this.ggv.current.d3Force('link').distance(forceLinkDistance).strength(forceLinkStrength)
      this.ggv.current.d3Force('charge').strength(forceChargeStrength)
      this.ggv.current.d3Force('radial', d3.forceRadial(this.props.forceRadial ? this.props.forceRadial : 1))
      this.ggv.current.d3Force('center', null)
    }
    if (url) {
      this.addToScene()
    } else if (!this.props.d2) {
      this.zoomCameraToFitScene()
    } else {
      this.forceUpdate()
    }
  }

  componentDidUpdate (prevProps, prevState) {
    const dimensions = ReactDOM.findDOMNode(this).parentNode.getBoundingClientRect()
    if (dimensions.width !== this.dimensions.width || dimensions.height !== this.dimensions.height) {
      this.dimensions = dimensions
      if (this.props.d2) {
        this.ggv.current.centerAt(0, 0, this.timeToCenter2DCamera)
      }
      this.forceUpdate()
    }
  }

  /**
   * 
   * @param {*} fnOrString 
   */
  fnOrField (fnOrString) {
    if (typeof fnOrString === 'string' || fnOrString instanceof String) {
      return obj => obj[fnOrString];
    }
    return fnOrString;
  }

  // add a obj file to the scene from url
  addToScene () {
    const { url, wireframe = true } = this.props
    var loader = new THREE.OBJLoader();
    // load a resource
    loader.load(
      // resource URL
      url,
      // called when resource is loaded
      object => {
        if (wireframe) {
          this.wireframeAnObject(object)
        }
        this.zoomCameraToFitScene(object)
        window.scene.add( object );
      },
      // called when loading is in progresses
      xhr => {
        console.log( ( xhr.loaded / xhr.total * 100 ) + '% loaded' );
      },
      // called when loading has errors
      error => {
        console.log( 'An error happened trying to load OBJ file into THREE scene.');
      }
    );
  }
  
  // wireframe the loaded obj file 
  wireframeAnObject = object => {
    const { wireframeColor = 0x6893DE } = this.props
    object.traverse( child => {
      if ( child instanceof THREE.Mesh ) {
        const { geometry, material } = child
        let mesh = new THREE.Mesh(geometry, material);
        window.scene.add(mesh);

        mesh.traverse(child => {
          if (child instanceof THREE.Mesh) {
            child.material.wireframe = true;
            child.material.color = new THREE.Color(wireframeColor);
          }
        });
      }
    })
  }

  getMaxAndMinVectors () {
    const { nodes } = this.props.data;
    var maxX = 0, maxY = 0, maxZ = 0, minX = 0, minY = 0, minZ = 0

    nodes.forEach(({ defaultX, defaultY, defaultZ }) => {
      if (defaultX) {
        if (defaultX > maxX) {
          maxX = defaultX
        } else if (defaultX < minX) {
          minX = defaultX
        }
      }

      if (defaultY) {
        if (defaultY > maxY) {
          maxY = defaultY
        } else if (defaultY < minY) {
          minY = defaultY
        }
      }

      if (defaultZ) {
        if (defaultZ > maxZ) {
          maxZ = defaultZ
        } else if (defaultZ < minZ) {
          minZ = defaultZ
        }
      }
    })

    const minVector = new THREE.Vector3( minX, minY, minZ );
    const maxVector = new THREE.Vector3( maxX, maxY, maxZ );
    
    return [minVector, maxVector, maxX || minY || maxY || minY || maxZ || minZ]
  }

  // cameraSizeRatioToNodeSize controls how big nodes look compared to 
  zoomCameraToFitScene (object = undefined, cameraSizeRatioToNodeSize = 400) {
    var offset = this.props.offset ? this.props.offset : 1.25
    const size = new THREE.Vector3();
    const center = new THREE.Vector3();
    const boundingBox = new THREE.Box3();

    if (object) {
      // if we load a OBJ file, we need to get the size of the boundary box
      boundingBox.setFromObject( object );
    } else {
      // if we maunally set the position of nodes in the graph, we need to adjust the camera in order to see those fixed nodes.
      const [ minV, maxV, containsFixedPoints ] = this.getMaxAndMinVectors()
      if (!containsFixedPoints) { 
        this.setState({ nodeSize: 1 })
        return 
      }
      boundingBox.set(minV, maxV);
    }
    
    boundingBox.getCenter(center);
    boundingBox.getSize(size);

    const maxDim = Math.max( size.x, size.y, size.z );
    
    const fov = this.ggv.current.camera().fov * ( Math.PI / 180 );
    
    let cameraZ = Math.abs( maxDim / 4 * Math.tan( fov * 2 ) )
    cameraZ *= offset;

    this.ggv.current.cameraPosition({ z: cameraZ })

    const minZ = boundingBox.min.z;
    const cameraToFarEdge = ( minZ < 0 ) ? -minZ + cameraZ : cameraZ - minZ;

    this.ggv.current.camera().far = cameraToFarEdge * 3;
    this.ggv.current.camera().updateProjectionMatrix();
    this.ggv.current.camera().lookAt( center )

    this.setState({ nodeSize: cameraZ / cameraSizeRatioToNodeSize })
  }

  // nodes with defined position, will not be draggable
  onNodeDrag = node => {
    if (node.position) {
      node.fx = node.position.x
      node.fy = node.position.y
      node.fz = node.position.z
    }
  }

  // nodes with defined position, will not have forces applied to them
  addFixedPositionToNodes = data => {
    data.nodes.forEach(node => {
      if (node.position) {
        node.fx = node.position.x
        node.fy = node.position.y
        node.fz = node.position.z
      }
    })
  }


  // Draw this: ( n1 )--- link_Label --->( n2 )
  linkCanvasObject (link, ctx, globalScale) {
    const color = this.getLinkColor(link)
    ctx.lineWidth = this.getLinkWidth(link)
    const xs = link.source.x
    const xt = link.target.x
    const ys = link.source.y
    const yt = link.target.y
    const cx = (xs + xt) / 2
    const cy = (ys + yt) / 2

    var linkText = this.getLinkLabel(link)
    var arrowSize = this.size * 0.2
    const linkLength = Math.sqrt((xt - xs) * (xt - xs) + (yt - ys) * (yt - ys));
    const availableSpaceForLinkLabel = linkLength - 2.1 * this.size - 6 * arrowSize

    // [-PI/2 ; PI/2]
    const angle = Math.atan((yt - ys) / (xt - xs))
    // [-PI ; PI]
    const angle2 = Math.atan2(yt - ys, xt - xs)

    const doNotPlotLinkLabel = !linkText || availableSpaceForLinkLabel < ctx.measureText('Abc...').width

    ctx.fillStyle = color
    ctx.strokeStyle = color
    if (doNotPlotLinkLabel) {
      linkText = ''
      ctx.beginPath();
      ctx.moveTo(xs, ys);
      ctx.lineTo(xt, yt);
      ctx.stroke();


    } else {
      if (linkText && ctx.measureText(linkText).width > availableSpaceForLinkLabel){
        var i = linkText.length - 3 // for the ... at the end
        while (ctx.measureText(linkText.substring(0, i) + '...').width > availableSpaceForLinkLabel) {
          i--
        }
        linkText = linkText.substring(0, i) + '...'
      }

      const textLength = ctx.measureText(linkText).width
      const subX = Math.cos(angle2) * textLength / 2
      const subY = Math.sin(angle2) * textLength / 2
      
      // Draw line from source node to link label
      ctx.beginPath();
      ctx.moveTo(xs, ys);
      ctx.lineTo(cx - subX, cy - subY);
      ctx.stroke();

      // Draw line from link label to target node
      ctx.beginPath();
      ctx.moveTo(cx + subX, cy + subY);
      ctx.lineTo(xt, yt);
      ctx.stroke()
    }
    
    // Draw text for link label
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(angle)
    if (linkText){
      ctx.fillText(linkText, 0, 0);
    }

    let nodeBorderDistance = this.size;
    // Some nodes are bigger than others, find distance from node center to corner and use this as size
    if ( link.target.width && link.target.height ){
      nodeBorderDistance = Math.sqrt((link.target.width / 2 ) * (link.target.width / 2 ) + (link.target.height / 2 ) * (link.target.height / 2 ));
    }
    
    // Draw arrow to indicate link direction
    var dist = (linkLength / 2 - nodeBorderDistance) - arrowSize
    ctx.fillStyle = color;
    ctx.beginPath();
    if (angle2 >= Math.PI / 2 || angle2 <= -Math.PI / 2){
      dist *= -1
      arrowSize *= -1
    }
    ctx.moveTo(arrowSize + dist, 0);
    ctx.lineTo(dist, 2.5);
    ctx.lineTo(dist, -2.5);
    ctx.fill()
    
    ctx.restore();
    

  }

  /*
   * Draw a node distributing the label in up to 3 lines with '...' in case the third line does not fit
   *    _____
   *   /  A  \
   *  (  node )
   *  ( label )
   *   \_____/
   */
  nodeWithName (node, ctx, globalScale) {
    const color = this.getNodeColor(node)
    const labelColor = this.getNodeLabelColor(node)

    ctx.font = this.font
    
    var label = this.getNodeLabel(node);
    
    ctx.fillStyle = color
    ctx.beginPath(); 
    ctx.arc(node.x, node.y, this.size, 0, 2 * Math.PI, false)
    ctx.fill();

    ctx.fillStyle = getDarkerColor(color)
    ctx.beginPath(); 
    ctx.arc(node.x, node.y, this.size - this.borderSize, 0, 2 * Math.PI, false)
    ctx.fill();

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = labelColor;
    
    const maxCharsPerLine = Math.floor(this.size * 1.75 / ctx.measureText("a").width)
      
    const nodeLabel = splitter(label, maxCharsPerLine)
    
    // Use single, double or triple lines to put text inside node
    if (nodeLabel.length == 1) {
      ctx.fillText(nodeLabel[0], node.x, node.y);
    } else if (nodeLabel.length == 2) {
      ctx.fillText(nodeLabel[0], node.x, node.y - this.doubleGap);
      ctx.fillText(nodeLabel[1], node.x, node.y + this.doubleGap);
    } else if (nodeLabel.length == 3){
      ctx.fillText(nodeLabel[0], node.x, node.y - this.tripleGap);
      ctx.fillText(nodeLabel[1], node.x, node.y);
      ctx.fillText(nodeLabel[2], node.x, node.y + this.tripleGap);
    } else {
      ctx.fillText(nodeLabel[0], node.x, node.y - this.tripleGap);
      ctx.fillText(nodeLabel[1], node.x, node.y);
      ctx.fillText(nodeLabel[2].slice(0, label.length - 2) + '...', node.x, node.y + this.tripleGap);
    }

  }

  render () {
    const { data, d2 = false, xGap = 20, yGap = 40, ...others } = this.props;
    
    this.addFixedPositionToNodes(data)
     
    const commonProps = {
      ref: this.ggv,
      graphData: data,
      width: this.dimensions.width - xGap,
      height: this.dimensions.height - yGap,
      onNodeDrag: node => this.onNodeDrag(node),
      ...others
    }

    if (d2) {
      return <div id={this.props.id ? this.props.id : "graph-2d"} style={this.props.containerStyle ? this.props.containerStyle : null} >
        { this.props.controls ? this.props.controls : null } 
        <ForceGraph2D 
          linkCanvasObjectMode={() => "replace"}
          linkCanvasObject={this.linkCanvasObject.bind(this)} 
          nodeCanvasObject={this.nodeWithName.bind(this)} 
          nodeRelSize={this.size} 
          {...commonProps}/>
      </div>
    } 
    return <ForceGraph3D {...commonProps} />
  }
}

GeppettoGraphVisualization.propTypes = {
  /**
   * Object with arrays of nodes and links used to render the graph.
   */
  data: PropTypes.shape({
    nodes : PropTypes.arrayOf(PropTypes.shape({ id : PropTypes.number.isRequired })).isRequired,
    links : PropTypes.arrayOf(PropTypes.shape({
      source: PropTypes.number.isRequired,
      target: PropTypes.number.isRequired
    })).isRequired
  }),
  /**
   * If true, the graph would be 2D.
   * (Default : false)
   */
  d2 : PropTypes.bool,
  /**
   * Specify the node label displayed in each node
   */
  nodeLabel : PropTypes.func,
  /**
   * Specify the link label displayed in each node
   */
  linkLabel : PropTypes.func,
  /**
   *  Specify a obj file URL to add to the scene.
   */
  url : PropTypes.string,
  /**
   * Create a wireframe for the object.
   * (Default : true)
   */
  wireframe : PropTypes.bool,
  /**
   * Specify the wireframe color (in hexadecimal).
   * (Default : "0x6893DE")
   */
  wireframeColor : PropTypes.string,
  /**
   * Define width gap size with respect to the parent container.
   * (Default : 20)
   */
  xGap : PropTypes.number,
  /**
   * Define height gap size with respect to the parent container.
   * (Default : 45)
   */
  yGap : PropTypes.number,
  /**
   * Set the default font size and style inside the nodes.
   * (Default : "6px Source Sans Pro")
   */
  font : PropTypes.string,
  /**
   * Adjust the size of the nodes.
   * (Default : 20)
   */
  nodeRelSize : PropTypes.number,
  /**
   * Adjust the length of the spring simulated between two nodes.
   * (Default : 90)
   */
  forceLinkDistance : PropTypes.number,
  /**
   * Adjust the stiffness coefficient for the spring simulated between two nodes
   * (Default : 0.7)
   */
  forceLinkStrength : PropTypes.number,
  /**
   * Adjust the repulsion coefficient simulated between two nodes.
   * (Default : -200)
   */
  forceChargeStrength : PropTypes.number,
  /**
   * Transition time in ms when centering camera in 2D Graph after window resize event. 
   * (Default : 0)
   */
  timeToCenter2DCamera : PropTypes.number,
  /**
   * Creates a radial atractive force of radial circle equal to forceRadial. 
   * Useful to avoid nodes scattering away when they have no links. 
   * (Default : 1)
   */
  forceRadial : PropTypes.number
};
