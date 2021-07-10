import React, { Component } from "react";
import PlotComponent from "./../../PlotComponent";
import Loader from "@geppettoengine/geppetto-ui/loader/Loader";

export default class PlotShowcase extends Component {
  constructor (props) {
    super(props);
    this.state = { hasModelLoaded: false, }
  }

  componentDidMount () {
    import(/* webpackChunkName: "plot_model.json" */'../model.json').then(model => {
      GEPPETTO.Manager.loadModel(model);
      this.instancePath = "nwbfile.acquisition.test_sine_1";
      Instances.getInstance(this.instancePath);
      Instances.getInstance(`${this.instancePath}.data`);
      Instances.getInstance(`${this.instancePath}.timestamps`);
      this.setState({ hasModelLoaded: true })
    })
  }


  extractLegendName (instanceY) {
    return instanceY.getInstancePath()
      .split('.')
      .filter((word, index, arr) => index !== 0 && index !== arr.length - 1)
      .join('.')
  }

  render () {
    const { hasModelLoaded } = this.state;
    const color = 'white';
    const guestList = [];
    const plots = [{
      x: `${this.instancePath}.timestamps`,
      y: `${this.instancePath}.data`,
      lineOptions: { color: color }
    }];

    if (guestList && guestList.length > 0) {
      plots.push(
        ...guestList.map(guest => ({
          x: `${guest.instancePath}.timestamps`,
          y: `${guest.instancePath}.data`,
          lineOptions: { color: guest.color }
        }))
      )
    }

    return hasModelLoaded ? (
      <div style={{ width: 600, height: 500 }}>
        <PlotComponent
          plots={plots}
          id={this.instancePath ? this.instancePath : "empty"}
          extractLegendName={this.extractLegendName} />
      </div>
    ) : <Loader active={true}/>
  }
}
