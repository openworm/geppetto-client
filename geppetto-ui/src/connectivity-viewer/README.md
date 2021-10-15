# Connectivity Viewer

This widget visualises connections between instances present in the Geppetto model, if any. The widget takes the Geppetto model factory as a prop and checks instances in the Geppetto model - if any connections between the instances are found they are visualised in the selected layout.  The layout initially displayed is controlled via the layout prop, while the user can then switch between layouts via the UI by clicking on the gear button. Currently, four layouts are supported: [adjacency matrix](https://en.wikipedia.org/wiki/Adjacency_matrix), [force directed graph](https://en.wikipedia.org/wiki/Force-directed_graph_drawing), [hive plot](http://www.hiveplot.com/) and [chord diagram](https://en.wikipedia.org/wiki/Chord_diagram).

```element
connectivity-viewer/ConnectivityComponent
```

## Examples

### Connectivity Matrix

Draws an adjacency matrix where each row [column] correspond to a source [target] node. Therefore, squares at i,j denote a directed edge (or connection) from node i to node j. The rows/columns can be sorted by node name, number of incoming connections, and number of outgoing connections. Circles above each row/column indicate the type of nodes in that row/column. More info on adjacency matrix [here](https://en.wikipedia.org/wiki/Adjacency_matrix).

```
connectivity-viewer/showcase/examples/ConnectivityShowcaseMatrix
```

### Connectivity Force

Draws circles for each node, connected by lines for each edge. Nodes repel each other (force directed) in order to reduce clutter, and can be interactively dragged. On hover the node names are revealed as tooltips. More info on force directed graph visualisation [here](https://en.wikipedia.org/wiki/Force-directed_graph_drawing).

```
connectivity-viewer/showcase/examples/ConnectivityShowcaseForce
```

## Libraries

[d3](https://www.npmjs.com/package/d3)
