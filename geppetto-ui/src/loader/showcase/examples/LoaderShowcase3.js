import React, { Component } from 'react';
import Loader from '../../Loader';
import Button from '@material-ui/core/Button';

export default class LoaderShowcase3 extends Component {
  constructor (props) {
    super(props);
    this.handleClose = this.handleClose.bind(this);
    this.handleToggle = this.handleToggle.bind(this);
    this.state = { active: false, };
  }

  handleClose () {
    const { active } = this.state;
    this.setState({ active: !active });
  }

  handleToggle () {
    const { active } = this.state;
    this.setState({ active: !active });
  }

  render () {
    const { active } = this.state;

    return (
      <div>
        <Button variant="outlined" color="primary" onClick={this.handleToggle}>
          Show Loader
        </Button>
        <Loader
          active={active}
          handleClose={this.handleClose}
          messages={['Loading Project', 'Did you know you can...']}
          elapsed={0.1}
        />
      </div>
    );
  }
}
