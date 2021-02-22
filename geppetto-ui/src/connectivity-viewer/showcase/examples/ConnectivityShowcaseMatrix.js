import React, { Component } from 'react';
import { Matrix } from '../../layouts/Matrix';
import ConnectivityComponent from '../../ConnectivityComponent';
import { withStyles } from '@material-ui/core';
import Loader from "@geppettoengine/geppetto-ui/loader/Loader";

const styles = {
  connectivity: {
    display: 'flex',
    alignItems: 'stretch',
    height: '600px',
    width: '500px',
  },
};

class ConnectivityShowcaseMatrix extends Component {
  constructor (props) {
    super(props);
    this.state = { hasModelLoaded: false, }
    this.linkType = this.linkType.bind(this);
  }

  componentDidMount () {
    import(/* webpackChunkName: "connectivity_model.json" */'../model.json').then(model => {
      GEPPETTO.Manager.loadModel(model);
      this.setState({ hasModelLoaded: true })
    })
  }

  linkType (c) {
    return GEPPETTO.ModelFactory.getAllVariablesOfType(
      c.getParent(),
      GEPPETTO.ModelFactory.geppettoModel.neuroml.synapse
    )[0].getId();
  }

  render () {
    const data = Instances[0];
    const layout = new Matrix();
    const colors = ['#cb0000', '#003398'];
    const names = ['pyramidals_48', 'baskets_12'];
    const { classes } = this.props;
    const { hasModelLoaded } = this.state;

    return hasModelLoaded ? (
      <div className={classes.connectivity}>
        <ConnectivityComponent
          id="ConnectivityContainerMatrix"
          data={data}
          colors={colors}
          names={names}
          layout={layout}
          modelFactory={GEPPETTO.ModelFactory}
          resources={GEPPETTO.Resources}
          matrixOnClickHandler={() =>
            console.log('Mock call to GEPPETTO.SceneController')
          }
          nodeType={null}
          linkWeight={null}
          linkType={this.linkType}
          library={null}
        />
      </div>
    ) : <Loader active={true}/>
  }
}

export default withStyles(styles)(ConnectivityShowcaseMatrix);
