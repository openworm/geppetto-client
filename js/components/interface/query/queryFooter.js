define(function (require) {

  var React = require('react');

  class QueryFooter extends React.Component {
    constructor (props) {
      super(props);

      this.displayName = 'QueryFooter';
    }
    
    render() {
      return (
        <div id="querybuilder-footer" className={this.props.containerClass}>
          <button id="run-query-btn" className="fa fa-cogs querybuilder-button" title="Run query" onClick={this.props.onRun} />
          <div id="query-results-label">{this.props.count.toString()} results</div>
        </div>
      );
    }
  }
  
  QueryFooter.defaultProps = {
    "count": 0,
    "onRun": undefined,
    "containerClass": ''
  };

  return QueryFooter;
});
