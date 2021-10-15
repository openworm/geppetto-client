define(function (require) {

  require("../query.less");
  require("../react-simpletabs.less");

  var React = require('react');
  var GEPPETTO = require('geppetto');

  class QueryLinkComponent extends React.Component {
    constructor (props) {
      super(props);
    }

    render () {
    
      var displayText = this.props.data;
      var path = this.props.rowData.id;
      var that = this;
    
      var action = function (e) {
        e.preventDefault();
        e.nativeEvent.stopImmediatePropagation();
        var actionStr = that.props.metadata.actions;
        actionStr = actionStr.replace(/\$entity\$/gi, path.split(that.props.metadata.entityDelimiter)[that.props.metadata.entityIndex]);
        GEPPETTO.CommandController.execute(actionStr);
        that.props.metadata.queryBuilder.close();
      };
    
      return (
        <div>
          <a href='#' onClick={action}>{displayText}</a>
        </div>
      )
    }
  }
  
  return QueryLinkComponent;
});