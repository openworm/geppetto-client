define(function (require) {

  var React = require('react');

  class QueryFooter extends React.Component {
    constructor (props) {
      super(props);

      this.displayName = 'QueryFooter';
    }
    
    render () {
      /*
       * While a count round-trip is in flight show "Counting..." instead of
       * a stale "0 results", so the user can tell running from empty.
       */
      var label = this.props.counting ? "Counting…" : (this.props.count.toString() + " results");
      return (
        <div id="querybuilder-footer" className={this.props.containerClass}>
          <button id="run-query-btn" className="fa fa-cogs querybuilder-button" title="Run query" onClick={this.props.onRun} />
          <div id="query-results-label">{label}</div>
        </div>
      );
    }
  }

  QueryFooter.defaultProps = {
    "count": 0,
    "counting": false,
    "onRun": undefined,
    "containerClass": ''
  };

  return QueryFooter;
});
