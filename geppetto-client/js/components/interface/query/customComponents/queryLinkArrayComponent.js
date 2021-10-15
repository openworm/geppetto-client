define(function (require) {

  require("../query.less");
  require("../react-simpletabs.less");
  
  var React = require('react');
  var GEPPETTO = require('geppetto');
  
  class QueryLinkArrayComponent extends React.Component {
    constructor (props) {
      super(props);
    }
  
    render () {
      
      var referencesList = this.props.data.split(';');
      var path = this.props.rowData.id;
      var that = this;
      var action = function (e) {
        e.preventDefault();
        e.nativeEvent.stopImmediatePropagation();
        var referencesList = that.props.data.split(';');
        var referenceIndex = referencesList.indexOf(e.target.innerText)
        var actionStr = that.props.metadata.actions;
        actionStr = actionStr.replace(/\$entity\$/gi, path.split(that.props.metadata.entityDelimiter)[that.props.metadata.entityIndex + referenceIndex]);
        GEPPETTO.CommandController.execute(actionStr);
        that.props.metadata.queryBuilder.close();
      };
      
      return (
        <div>
          {referencesList.map((item, index) => <a key={index} href='#' onClick={action}>{item}</a>)}
        </div>
      )
    }
  }
    
  return QueryLinkArrayComponent;
});
