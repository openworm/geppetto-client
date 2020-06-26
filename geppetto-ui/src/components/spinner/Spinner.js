import React, { Component, Fragment } from 'react';
import { withStyles } from '@material-ui/core';
import PropTypes from 'prop-types';
import Backdrop from '@material-ui/core/Backdrop';
import CircularProgress from '@material-ui/core/CircularProgress';
import LinearProgress from '@material-ui/core/LinearProgress';
import Typography from '@material-ui/core/Typography';

const styles = (theme) => ({
  backdrop: {
    zIndex: theme.zIndex.drawer + 1,
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
    const {
      classes,
      active,
      handleClose,
      messages,
      elapsed,
      backgroundStyle,
      children,
    } = this.props;
    const { messageIndex } = this.state;

    const message = messages.length > 0 ? messages[messageIndex] : '';
    const progress = elapsed ? (
      <LinearProgress
        variant="determinate"
        value={elapsed * 100}
        style={{ width: '200px' }}
      />
    ) : (
      <CircularProgress color="inherit" />
    );

    const content = children ? (
      children
    ) : (
      <Fragment>
        {progress}
        <Typography
          display="block"
          variant="subtitle1"
          gutterBottom
          style={{ color: 'white' }}
        >
          {message}
        </Typography>
      </Fragment>
    );

    console.log(children);
    return (
      <div>
        <Backdrop
          className={classes.backdrop}
          open={active}
          onClick={handleClose}
          style={backgroundStyle}
        >
          {content}
        </Backdrop>
      </div>
    );
  }
}

Spinner.defaultProps = {
  active: true,
  messages: [],
  messagesInterval: 10000,
  elapsed: null,
  backgroundStyle: {},
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
  /**
   * Number of the progress value to show in linear deterimante (in percentage)
   */
  elapsed: PropTypes.number,
  /**
   * Style to be applied to the spinner background
   */
  backgroundStyle: PropTypes.object,
};

export default withStyles(styles)(Spinner);
