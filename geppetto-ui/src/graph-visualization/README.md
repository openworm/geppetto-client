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

## Adding obj to scene

- **url**: String (Optional)
    Specify a obj file URL to add to the scene.
- **wireframe**: Bool (Optional. Default: true)
    Create a wireframe for the object.
- **wireframeColor**: Hex (Optional. Default: *0x6893DE*)
    Specify the wireframe color (in hexadecimal).

## Selectively hold nodes in place

To lock some of the nodes in place, add *defaultX*, *defaultY* and *defaultZ* property to them.

```javascript
const nodes = [
    { id: 0 }, // free to move
    { id: 1, defaultX:0, defaultY:0, defaultZ:0 }, // locked
    { id: 2 }, // free to move
]
```

---

## [More...](https://github.com/vasturiano/react-force-graph/blob/master/README.md)
