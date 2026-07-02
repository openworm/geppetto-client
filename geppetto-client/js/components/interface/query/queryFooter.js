define(function (require) {

  var React = require('react');

  class QueryFooter extends React.Component {
    constructor (props) {
      super(props);

      this.displayName = 'QueryFooter';
    }
    
    render () {
      /*
       * Show "Counting..." while a count is in flight OR unknown (count < 0,
       * the auto-run path before the query's results set the real count),
       * instead of a stale "0 results" or a bogus "-1 results".
       */
      var label = (this.props.counting || this.props.count < 0) ? "Counting…" : (this.props.count.toString() + " results");
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
