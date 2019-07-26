import React from 'react';
import ListViewer from '../ListViewer';
import instances from './instances-small.json';
import { GroupComponent, IconComponent, LinkComponent, ImageComponent, ParameterInputComponent, ColorComponent, MultiStatusComponent } from '../ListViewer';

const CustomHeading = ({ title }) => <span style={{ color: '#AA0000' }}>{title}</span>;


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
    source: entity => entity.path, // Source is always optional. If not defined it will equal to entity => entity
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

export default class ListViewerShowcase extends React.Component {
   
  zoomAction (param) {
    console.log(param);
    alert("zoom " + param);
  }
  render () {
    
    return [this.exampleDefault(), 
            this.exampleFilter(),
            this.exampleScroll(),
            this.exampleFull()]
  }


  exampleDefault () {
    return <div id="example-default">
      <h1>Simple example with default parameters</h1>
      <div >
        <ListViewer instances={instances} />
      </div>
    </div>;
  }

  exampleFilter () {
    return <div id="example-filter">
      <h1>Simple example with data filter</h1>
      <p>Here we are filtering all data to be of metaType "CompositeType"</p>
      <div>
        <ListViewer filter={row => row.metaType === 'CompositeType'} instances={instances} />
      </div>
    </div>;
  }

  exampleScroll () {
    return <div id="example-scroll">
      <h1>Simple example with infinite scroll</h1>
      <p>Here we are filtering all data to be of metaType "CompositeType"</p>
<<<<<<< HEAD
      <div style={{ height: "400px", width: "100%" }}>
=======
      <div style={{ height: "400px", width: "100%", display: "flex", flexDirection: "column" }}>
>>>>>>> feature/41
        <ListViewer infiniteScroll={true} instances={instances} />
      </div>
    </div>;
  }

  exampleFull () {
<<<<<<< HEAD
    return <div id="example-filter">
      <h1>Example with common features</h1>
      <div style={{ height: "900px", width: "100%" }}>
=======
    return <div id="example-features">
      <h1>Example with common features</h1>
      <div style={{ height: "900px", width: "100%", display: "flex", flexDirection: "column" }}>
>>>>>>> feature/41
        <ListViewer columnConfiguration={conf} filter={() => true} infiniteScroll={true} instances={instances} handler={this} />
      </div>;
    </div>
  }
}