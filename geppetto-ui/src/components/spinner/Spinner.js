import React, { Component } from 'react';
import { withStyles } from '@material-ui/core';
import PropTypes from 'prop-types';
import Backdrop from '@material-ui/core/Backdrop';
import CircularProgress from '@material-ui/core/CircularProgress';
import Typography from '@material-ui/core/Typography';

const styles = (theme) => ({
  backdrop: {
    zIndex: theme.zIndex.drawer + 1,
    color: '#fff',
  },
});

class Spinner extends Component {
  constructor(props) {
    super(props);
    this.state = {
      messageIndex: 0,
    };
  }

  componentDidMount() {
    const { messagesInterval } = this.props;

    setInterval(() => {
      const { messageIndex } = this.state;
      const { messages } = this.props;
      this.setState({ messageIndex: (messageIndex + 1) % messages.length });
    }, messagesInterval);
  }

  render() {
    const { classes, active, handleClose, messages } = this.props;
    const { messageIndex } = this.state;

    const message = messages.length > 0 ? messages[messageIndex] : '';

    return (
      <div>
        <Backdrop
          className={classes.backdrop}
          open={active}
          onClick={handleClose}
        >
          <CircularProgress color="inherit" />
          <Typography display="block" variant="subtitle1" gutterBottom>
            {message}
          </Typography>
        </Backdrop>
      </div>
    );
  }
}

Spinner.defaultProps = {
  active: true,
  messages: [],
  messagesInterval: 10000,
  handleClose: () => {},
};

Spinner.propTypes = {
  /**
   * Flag to show/hide the spinner
   */
  active: PropTypes.bool,
  /**
   * Function to handle the close of the spinner
   */
  handleClose: PropTypes.func,
  /**
   * Array of Custom messages to display
   */
  messages: PropTypes.array,
  /**
   * Number of miliseconds between custom messages
   */
  messagesInterval: PropTypes.number,
};

export default withStyles(styles)(Spinner);
