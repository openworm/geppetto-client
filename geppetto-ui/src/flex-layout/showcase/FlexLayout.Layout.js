import PropTypes from 'prop-types';
import React from 'react';

class FlexLayoutPropTypes extends React.Component {
  constructor (props) {
    super(props);
  }
  render () {
    return <span />;
  }
}

FlexLayoutPropTypes.propTypes = {
  /**
   * Test proptypes for FlexLayout
   * 
   */
  test: PropTypes.bool,
};

export default FlexLayoutPropTypes;
