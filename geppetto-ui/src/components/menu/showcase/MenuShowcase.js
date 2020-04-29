import React, { Component } from "react";
import Menu from "../Menu";
import model from "./model.json";

export default class MenuShowcase extends Component {
  constructor (props) {
    super(props);
    GEPPETTO.Manager.loadModel(model);
    this.menuConfiguration = require('./menuConfiguration').default;
    this.menuHandler = this.menuHandler.bind(this);
  }

  menuHandler (click) {
    const historyList = [];
    console.log(click.handlerAction);
    if (click.handlerAction === 'historyMenuInjector') {
      historyList.push(
        {
          label: "adult brain template JFRC2",
          icon: "",
          action: {
            handlerAction: "triggerSetTermInfo",
            value: console.log("adult brain template JFRC2")
          }
        },
      );
    }
    return historyList;
  }

  render () {
    return (
      <Menu
        configuration={this.menuConfiguration}
        menuHandler={this.menuHandler}/>
    );
  }
}