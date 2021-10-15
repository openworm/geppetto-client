define(function (require) {
  
  require("./query.less");
  require("./react-simpletabs.less");

  var React = require('react');

  class QueryItem extends React.Component {
    constructor (props) {
      super(props);

      this.displayName = 'QueryItem';
    }
    
    render () {
      var createItem = function (item, key) {
        return <option key={key} value={item.value}>{item.name}</option>;
      };
    
      var that = this;
      var onSelection = function (e) {
        var val = parseInt(e.target.value);
        that.props.onSelectOption(that.props.item, val);
      };
    
      var containerId = "queryitem-" + this.props.item.id;
    
      return (
        <div id={containerId} className="query-item">
          <button className="fa fa-trash-o query-item-button" title="delete item" onClick={this.props.onDeleteItem} />
          <select className="query-item-option" onChange={onSelection} value={this.props.item.selection}>
            {this.props.item.options.map(createItem)}
          </select>
          <div className="clearer"></div>
        </div>
      );
    }
  }

  QueryItem.defaultProps = {
    "item": null,
    "options": [],
    "onSelectOption": undefined,
    "onDeleteItem": undefined,
  };
  
  return QueryItem;
});