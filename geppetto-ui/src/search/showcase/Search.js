import PropTypes from 'prop-types';
import React from 'react';

class SearchPropTypes extends React.Component {
  constructor (props) {
    super(props);
  }
  render () {
    return <span />;
  }
}

SearchPropTypes.propTypes = {
  /**
   * String that defines the datasource to be used
   */
  datasource: PropTypes.string.isRequired,
  /**
   * json configuration that defines all the configurable elements of the component
   */
  searchConfiguration: PropTypes.any.isRequired,
  /**
   * json configuration to set all the information required by the datasource (e.g. query, pagination, etc)
   */
  datasourceConfiguration: PropTypes.any.isRequired,
  /**
   * json style configuration used to defined the component style
   */
  searchStyle: PropTypes.any,
  /**
   * if the string used is CUSTOM then we can define our own datasource and pass it as a function using this prop
   */
  customDatasourceHandler: PropTypes.func
};

export default SearchPropTypes;
