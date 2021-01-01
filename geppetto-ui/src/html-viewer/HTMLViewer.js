import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import { withStyles } from '@material-ui/core';
import PropTypes from 'prop-types';

class HTMLViewer extends Component {
  constructor (props) {
    super(props);

    this.state = { content: this.props.content };
    this.handleClick = this.handleClick.bind(this);
    this.htmlViewer = React.createRef();
  }

  setContent (content) {
    this.setState({ content });
  }

  UNSAFE_componentWillReceiveProps (nextProps) {
    if (nextProps.content != this.props.content) {
      this.setState({ content: nextProps.content });
    }
  }

  componentDidMount () {
    const element = ReactDOM.findDOMNode(this.htmlViewer.current);
    element.setAttribute('tabIndex', -1);
  }

  handleClick (e) {
    const element = e.target;
    if (element.matches('a') && element.dataset && this.props.handleClick != undefined) {
      this.props.handleClick(element, element.dataset);
    }
  }

  render () {
    const { content } = this.props;
    return (
      <div ref={this.htmlViewer} style={this.props.style}>
        <div
          dangerouslySetInnerHTML={{ __html: content }}
          onClick={this.handleClick}
        ></div>
      </div>
    );
  }
}

HTMLViewer.propTypes = {
  /**
   * HTML content to be displayed.
   */
  content: PropTypes.string.isRequired,
  /**
   * Styles to apply to the HTML content container
   */
  style: PropTypes.object.isRequired,
  /**
   * Function to handle link's dataset actions
   */
  handleClick: PropTypes.func.isRequired,
};

export default HTMLViewer;
