# Geppetto Graph Visualizer (GGV)

## Parameters

- **data**:

```javascript
{
    nodes: [
        {id: 1},
        {id: 2},
        {id: 3}
    ],
    links: [
        {source: 1, target: 2},
        {source: 2, target: 3},
        {source: 3, target: 1}
    ]
}
```

If we update the data preserving the references to each node, then the graph will preserve the position, but if a new reference is provided for a particular node, then the graph will reset the position of that particular node.

- **d2**: Bool (Optional. Default: false)
    If true, the graph would be 2D.

## Adding obj to scene

- **url**: String (Optional)
    Specify a obj file URL to add to the scene.
- **wireframe**: Bool (Optional. Default: true)
    Create a wireframe for the object.
- **wireframeColor**: Hex (Optional. Default: *0x6893DE*)
    Specify the wireframe color (in hexadecimal).
- **xGap**: Int (Optional. Default: 20)
    Define width gap size with respect to the parent container.
- **yGap**: Int (Optional. Default: 45)
    Define height gap size with respect to the parent container.

## properties for 2d graph

- **font**: String (Optional. Default: "6px Source Sans Pro")
    Set the default font size and style inside the nodes.
- **nodeRelSize**: Int (Optional. Default: 20).
    Adjust the size of the nodes.

---

## Forces

- **forceLinkDistance**: Int (Optional. Default: 90).
    Adjust the length of the spring simulated between two nodes.
- **forceLinkStrength**: Int (Optional. Default: 0.7).
    Adjust the stiffness coiefficient for the spring simulated between two nodes
- **forceChargeStrength**: Int (Optional. Default: -200).
    Adjust the repulsion coefficient simulated between two nodes.
- **timeToCenter2DCamera**: Int (Optional. Default: 0).
    Transition time in ms when centering camera in 2D Graph after window resize event.
- **forceRadial**: Int (Optional. Default: 1).
    Creates a radial atractive force of radial circle equal to forceRadial. Useful to avoid nodes scattering away when they have no links.

## Disable drag and forces for some nodes

If a node has the property `position` set (as in the example below), then that node will retain a fixed position and dragging will not be allowed.

Example:

```javascript
import React, { Component } from 'react'
import GeppettoGraphVisualization from 'geppetto-client/js/components/interface/graph-visualization/Graph'

export default class GraphView extends Component {

  getData () {
    const instances = window.Instances
    if (!instances) {
      return { nodes: [], links: [] }
    }

    // build list of nodes
    const nodes = instances.filter(inst => inst.getMetaType() == "SimpleInstance" && inst.getType().getName() == "BrainRegion")
      .map(node => {
        const pos = node.getPosition()
        return {
          id: node.getId(),
          name: node.getName(),
          position: node.getPosition()
        }
      })

    // build list of links same way
    const links = instances.filter(inst => inst.getMetaType() == "SimpleConnectionInstance")
      .map(conn => ({ source: conn.a.getId(), target: conn.b.getId(), id: conn.getId(), name: conn.getName() }))

    const links = []

    return { nodes, links }

  }

  render () {
    return (
      <GeppettoGraphVisualization
        data={this.getData()}
        nodeLabel={node => node.name}
        linkLabel={link => link.name}
      />
    )
  }
}
```

---

The component accepts the props defined [here](https://github.com/vasturiano/react-force-graph/blob/master/README.md).
