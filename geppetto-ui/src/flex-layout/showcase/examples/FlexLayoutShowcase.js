import React, { Component } from 'react';
import * as FlexLayout from './../../src';

const json = {
  global: {
    tabEnableClose: true,
    tabSetHeaderHeight: 26,
    tabSetTabStripHeight: 26,
  },
  borders: [
    {
      type: 'border',
      location: 'bottom',
      size: 100,
      children: [],
      barSize: 35,
    },
  ],
  layout: {
    type: 'row',
    weight: 100,
    children: [
      {
        type: 'row',
        weight: 55,
        selected: 0,
        children: [
          {
            type: 'tabset',
            weight: 36,
            children: [
              {
                type: 'tab',
                name: 'Tab One',
                component: 'text',
              },
            ],
          },
          {
            type: 'tabset',
            weight: 64,
            children: [
              {
                type: 'tab',
                name: 'Tab Two',
                component: 'text',
              },
            ],
          },
        ],
      },
      {
        type: 'tabset',
        weight: 45,
        selected: 0,
        children: [
          {
            type: 'tab',
            name: 'Tab Three',
            component: 'text',
          },
          {
            type: 'tab',
            name: 'Tab Four',
            component: 'text',
          },
        ],
      },
    ],
  },
};

export default class FlexLayoutShowcase extends Component {
  constructor (props) {
    super(props);
    this.state = { model: FlexLayout.Model.fromJson(json) };
  }

  factory (node) {
    return <div className="flexChildContainer">Content {node.getName()}</div>;
  }

  render () {
    return (
      <div style={{ position: 'relative', height: '800px', width: '1200px' }}>
        <FlexLayout.Layout
          model={this.state.model}
          factory={this.factory.bind(this)}
        />
      </div>
    );
  }
}
