import React, { Component } from 'react';
import HTMLViewer from '../../HTMLViewer';
require('../HTMLViewerShowcase.less');

export default class HTMLViewerShowcase extends Component {
  constructor (props) {
    super(props);
    this.handleClick = this.handleClick.bind(this);
    this.htmlContent = require('../HTMLViewerShowcase.html');
  }

  handleClick (element, elementDataset) {
    console.log('Click handler triggered.');
    if (elementDataset.action) {
      console.log(elementDataset.action);
    }
  }
  render () {
    return (
      <HTMLViewer
        content={this.htmlContent}
        style={{
          width: '100%',
          height: '100%',
          float: 'center',
        }}
        handleClick={this.handleClick}
      />
    );
  }
}
