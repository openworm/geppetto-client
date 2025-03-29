define(function (require) {

  var React = require('react');

  class QueryFooter extends React.Component {
    constructor (props) {
      super(props);

      this.displayName = 'QueryFooter';
    }
    
    render () {
      return (
        <div id="querybuilder-footer" className={this.props.containerClass}>
          <button id="run-query-btn" className="fa fa-cogs querybuilder-button" title="Run query" onClick={this.props.onRun} />
          <div id="query-results-label">{this.props.count.toString()} results</div>
          {this.props.showLongQueryMessage && 
            <div className="query-long-running-message">
              This query is returning a lot of results and might take up to 2 minutes. 
              <a href="#" onClick={(e) => {e.preventDefault(); this.props.onCancelQuery();}}>Click here to cancel</a> or wait for results.
            </div>
          }
        </div>
      );
    }
  }
  
  QueryFooter.defaultProps = {
    "count": 0,
    "onRun": undefined,
    "containerClass": '',
    "showLongQueryMessage": false,
    "onCancelQuery": undefined
  };

  return QueryFooter;
});
