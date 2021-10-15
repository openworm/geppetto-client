import React, { Component } from 'react';
import Menu from './../../Menu';
import model from './../model.json';

export default class MenuShowcase extends Component {
  constructor (props) {
    super(props);
    this.menuConfiguration = require('../menuConfiguration').default;
    this.menuHandler = this.menuHandler.bind(this);
  }

  /**
   * Handler function triggered when a Menu item is clicked.
   */
  menuHandler (click) {
    const historyList = [];
    console.log(click.handlerAction);
    // Check the handlerAction associated with Menu item clicked
    if (click.handlerAction === 'historyMenuInjector') {
      // Add to history List.
      historyList.push({
        label: 'adult brain template JFRC2',
        icon: '',
        action: {
          handlerAction: 'triggerSetTermInfo',
          value: console.log('adult brain template JFRC2'),
        },
      });
    }
    return historyList;
  }

  render () {
    return (
      <Menu
        configuration={this.menuConfiguration}
        menuHandler={this.menuHandler}
      />
    );
  }
}
