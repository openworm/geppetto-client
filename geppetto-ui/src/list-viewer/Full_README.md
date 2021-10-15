# ListViewer component

Allows to define configurable list.
Based on griddle and configuration is similar to old ControlPanel with many api improvements.

## How to use

### Default configuration
```javascript
const entities = [
    {
        "path": "acnet2",
        "metaType": "CompositeType",
        "type": "Model.neuroml.network_ACnet2",
        "static": false
    },
    {
        "path": "Model.neuroml.network_ACnet2.temperature",
        "metaType": "ParameterType",
        "type": "Model.common.Parameter",
        "static": true
    },
    {
        "path": "acnet2.pyramidals_48",
        "metaType": "ArrayType",
        "type": "Model.neuroml.pyramidals_48",
        "static": false
    }
];
return <ListViewer instances={entities} />
```

or use the available instances from Geppetto with

```javascript
() => <ListViewer instances={GEPPETTO.ModelFactory.allPaths} />
```

### Custom columns

Custom column definition can be specified with the parameter `columnConfiguration`.
The parameters are pretty much the same of [Griddle](https://griddlegriddle.github.io/v0-docs/customization.html), with a few improvements.

```javascript
const conf = {
 {
    // Default renderer: shows the value
    id: "path",
    title: "Path",
    source: 'path', // entity.path. Same as (entity) => entity.path
    cssClassName: 'red', // custom css class
    action: function (entity) {
      return this.selectAction(entity); // 'this' is bound to the handler
    },
  },
  {
    // A link
    id: "link",
    title: "Link",
    source: () => 'http://www.geppetto.org/',
    customComponent: LinkComponent,
    configuration: { text: 'Geppetto' }
  },
};
return <ListViewer columnConfiguration={conf} instances={entities} handler={this} />


```
#### Column configuration
* `id` must be unique within the configuration
* `source` maps the entity with the column `value`. Can be a string, a function or an arrow function.
* `title` is the title for the column
* `customComponent` is a custom component. `value` within the props defines the current entity value
* `configuration` is the configuration for the custom component (if any)
* `action` callback action (usually click or change) on the column element. Can be a string, a function or an arrow function. Takes the element value as parameter (parameters may change on custom components)
  * String: a bound function with the same name is called on the handler object.
    * Example: `"path"`. Maps to `handler.path(value)`
  * function: is bound on the handler object (can use this).
    * Example: `function(value) { return this.anotherFunc(value)}`
  * arrow function: binding (if any) on the configuration context
    * Example: `(value) => console.log(value)` (no binding for this on the handler)

### Custom component
Base custom components are compatible with [Griddle](https://griddlegriddle.github.io/v0-docs/customization.html) custom components.
A simple custom component is:
```javascript
({value}) => <span>value</span>
```
A custom component can be also configurable: in that case it's defined as a function accepting the configuration and returning the actual Griddle custom component:

```javascript
(conf) => ({value}) => <span>value</span>
```

Some custom configurable components are available directly from ListViewer:
* `IconComponent`
* `GroupComponent`: allows to show more custom components on the same column
* `MultiStatusComponent`: each click shows a different icon and calls a different action. Useful for toggle/untoggle behaviours
* `ImageComponent`: shows an image
* `ParameterInputComponent`: simple text input
* `ColorComponent`: icon that opens a color picker

### Handler
The `handler` parameter allows to specify an handler context to which the callbacks specified are bound.

## Example configuration

See ListViewerShowCase.js

```javascript
const conf = [
  {
    // Default renderer: shows the value
    id: "path",
    title: "Path",
    source: 'path', // entity.path. Same as (entity) => entity.path
    cssClassName: 'red', // custom css class
    action: function (entity) {
      return this.selectAction(entity); // 'this' is bound to the handler
    },
  },
  {
    // A link
    id: "link",
    title: "Link",
    source: () => 'http://www.geppetto.org/',
    customComponent: LinkComponent,
    configuration: { text: 'Geppetto' }
  },
  {
    // An external image
    id: "image",
    title: "Image",
    source: () => 'https://www.virtualflybrain.org/data/VFB/i/0002/9717//thumbnailT.png',
    customComponent: ImageComponent,
    configuration: {
      alt: "Alt for the image",
      title: "Image title",
      action: () => alert('Image') // Action is optional
    }
  },
  {
    id: "color",
    title: "Color",
    customComponent: ColorComponent,
    source: entity => entity.path,
    configuration: {
      action: (model, color) => console.log(model, color, this), // Lambda will not be bound to the handler component. 'this' will refer to the current context
      defaultColor: '#FF0000',
      label: "Rocket",
      tooltip: "Red Rocket tooltip"
    },

  },
  {
    // Define a custom render component inline
    id: "custom",
    title: "Custom",
    customComponent: value => <span>Inline <strong>custom</strong><br/> component</span>,
    source: entity => entity.path, // Source is always optional. If not defined it will equal toentity => entity
  },
  {
    // Input 
    id: 'input',
    title: 'Input',
    customComponent: ParameterInputComponent,
    configuration: {
      placeholder: "Insert value",
      defaultValue: 3,
      type: 'number',
      onBlur: (obj, value) => console.log("New value: " + value),
      onKeyPress:  (obj, value) => console.log(obj, value),
      readOnly: false, 
      classString: 'input-custom',
      unit: 'mm' 
    }
  },
 
  {
    // Group components under the same column
    id: "controls",
    source: entity => entity,
    title: "Controls",
    customComponent: GroupComponent,
    customHeadingComponent: CustomHeading, // Define also a custom heading (griddle api)
    
    configuration: [
      {
        // An icon. Icon codes are font awesome names
        id: "plot",
        customComponent: 'IconComponent', // We can use the string for default components
        configuration: {
          action: entity => alert('plot'),
          icon: 'area-chart',
          tooltip: "Plot time series"
        },

      },
      {
        id: "zoom",
        customComponent: IconComponent,
        configuration: {
          action: 'zoomAction', // This will call the method on the handler component: handler.zoomAction(value) 
          icon: 'search-plus',
          tooltip: "Zoom in 3D canvas"
        },

      },
      {
        // Multistatus implementing a toggle behaviour
        id: "toggle",
        customComponent: MultiStatusComponent,
        source: entity => entity.path,
        configuration: [ // Can define how many statuses as we want. They will be changed in sequence at each click
          {
            action: v => alert('from on to off ' + v),
            icon: 'hand-stop-o',
            tooltip: "Turn off"
          },
          {
            action: v => alert('from off to on ' + v),
            icon: 'hand-rock-o',
            tooltip: "Turn on"
          }
        ]
      },

      
    ]
  },
  
  {
    // This won't show
    id: "pathHidden",
    displayName: "Path",
    visible: false,
    source: entity => entity.path
  }
];
```

---

## Customize Filter Component

```javascript
class CustomFilter extends Component {
  render() {
    return <h3>Do 🧙‍♀️<h3/>
  }
}
```

```javascript
render () {
    return <ListViewer
      {...}
      customComponents={{ Filter: CustomFilter }}
    />
  }
```
