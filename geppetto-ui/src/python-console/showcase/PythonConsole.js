import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Loader from "@geppettoengine/geppetto-ui/loader/Loader";

class PythonConsole extends Component {
  constructor (props) {
    super(props);
    this.state = { gif: false, }
  }

  componentDidMount () {
    import(/* webpackChunkName: "console.gif" */'./console.gif').then(gif => {
      this.setState({ gif: gif.default })
    })
  }

  render () {
    const { gif } = this.state;
    return gif ? <img src={gif} /> : <Loader active={true}/>
  }
}

PythonConsole.propTypes = {
  /**
   * Path to jupyter notebook
   */
  pythonNotebookPath: PropTypes.string.isRequired,
  /**
   * Height of the iframe in pixels
   */
  iframeHeight: PropTypes.number,
};

export default PythonConsole;
