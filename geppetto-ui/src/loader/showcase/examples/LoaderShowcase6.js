import React, { Component, Fragment } from 'react';
import Loader from '../../Loader';
import Button from '@material-ui/core/Button';
import * as FlexLayout from '../../../flex-layout/src';
import { withStyles } from '@material-ui/core';

const styles = () => ({
  container: {
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

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
                component: 'loader',
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
    ],
  },
};

class LoaderShowcase6 extends Component {
  constructor (props) {
    super(props);
    this.handleClose = this.handleClose.bind(this);
    this.handleToggle = this.handleToggle.bind(this);
    this.state = { model: FlexLayout.Model.fromJson(json), active: false };
  }

  handleClose () {
    const { active } = this.state;
    this.setState({ active: !active });
  }

  handleToggle () {
    const { active } = this.state;
    this.setState({ active: !active });
  }

  factory (node) {
    const { active } = this.state;
    const { classes } = this.props;
    const component = node.getComponent();

    if (component === 'loader') {
      return (
        <div className={classes.container}>
          <Fragment>
            <Button
              variant="outlined"
              color="primary"
              onClick={this.handleToggle}
            >
              Show Loader
            </Button>
            <Loader
              active={active}
              handleClose={this.handleClose}
              fullscreen={false}
            />
          </Fragment>
        </div>
      );
    } else {
      return <div className="flexChildContainer">Content {node.getName()}</div>;
    }
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

export default withStyles(styles)(LoaderShowcase6);
