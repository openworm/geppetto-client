import React, { Component } from 'react';
import ListViewerShowcase from '@geppettoengine/geppetto-ui/src/listViewer/showcase/ListViewerShowcase';
import Graph from '@geppettoengine/geppetto-ui/src/graph-visualization/Graph';
export default class Application extends Component {

  constructor (props) {
    super(props);
  }


  render () {

    return (
      [
        <Graph />,
        <ListViewerShowcase />
      ]
      
    );
  }
}
