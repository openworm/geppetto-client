define(function (require) {
  
  require("../query.less");
  require("../react-simpletabs.less");

  var React = require('react');
  var GEPPETTO = require('geppetto');

  class QueryResultsControlsComponent extends React.Component {
    constructor (props) {
      super(props);

    }

    replaceTokensWithPath (inputStr, path) {
      return inputStr.replace(/\$ID\$/gi, path);
    }
    
    getActionString (control, path) {
      var actionStr = '';
    
      if (control.actions.length > 0) {
        for (var i = 0; i < control.actions.length; i++) {
          actionStr += ((i != 0) ? ";" : "") + this.replaceTokensWithPath(control.actions[i], path);
        }
      }
    
      return actionStr;
    }
    
    resolveCondition (control, path, negateCondition) {
      if (negateCondition == undefined) {
        negateCondition = false;
      }
    
      var resolvedConfig = control;
    
      if (resolvedConfig.hasOwnProperty('condition')) {
        // evaluate condition and reassign control depending on results
        var conditionStr = this.replaceTokensWithPath(control.condition, path);
        if (eval(conditionStr)) {
          resolvedConfig = negateCondition ? resolvedConfig.false : resolvedConfig.true;
        } else {
          resolvedConfig = negateCondition ? resolvedConfig.true : resolvedConfig.false;
        }
      }
    
      return resolvedConfig;
    }
    
    render () {
      // TODO: would be nicer to pass controls and config straight from the parent component rather than assume
      var config = this.props.metadata.queryBuilder.state.resultsControlsConfig;
      var resultItemId = this.props.rowData.id;
      var ctrlButtons = [];
    
      // Add common control buttons to list
      for (var control in config.Common) {
        var add = true;
    
        // check show condition
        if (config.Common[control].showCondition != undefined) {
          var condition = this.replaceTokensWithPath(config.Common[control].showCondition, resultItemId);
          add = eval(condition);
        }
    
        if (add) {
          ctrlButtons.push(config.Common[control]);
        }
      }
    
      var that = this;
    
      return (
        <div>
          {ctrlButtons.map(function (control, id) {
            // grab attributes to init button attributes
            var controlConfig = that.resolveCondition(control, resultItemId);
            var idVal = resultItemId.replace(/\./g, '_').replace(/\[/g, '_').replace(/\]/g, '_') + "_" + controlConfig.id + "_queryResults_btn";
            var tooltip = controlConfig.tooltip;
            var classVal = "btn queryresults-button fa " + controlConfig.icon;
            var styleVal = {};
    
            // define action function
            var actionFn = function (param) {
              // NOTE: there is a closure on 'control' so it's always the right one
              var controlConfig = that.resolveCondition(control, resultItemId);
    
              // take out action string
              var actionStr = that.getActionString(controlConfig, resultItemId);
    
              if (param != undefined) {
                actionStr = actionStr.replace(/\$param\$/gi, param);
              }
    
              // run action
              if (actionStr != '' && actionStr != undefined) {
                GEPPETTO.CommandController.execute(actionStr);
                // check custom action to run after configured command
                if (that.props.metadata.action != '' && that.props.metadata.action != undefined) {
                  // straight up eval as we don't want this to show on the geppetto console
                  eval(that.props.metadata.action.replace(/\$ID\$/gi, resultItemId));
                }
              }
    
              // if conditional, swap icon with the other condition outcome
              if (control.hasOwnProperty('condition')) {
                var otherConfig = that.resolveCondition(control, path);
                var element = $('#' + idVal);
                element.removeClass();
                element.addClass("btn queryresults-button fa " + otherConfig.icon);
              }
            };
    
            return (
              <span key={id}>
                <button id={idVal}
                  className={classVal}
                  style={styleVal}
                  title={tooltip}
                  onClick={actionFn}>
                </button>
              </span>
            )
          })}
        </div>
      )
    }
  }
  
  return QueryResultsControlsComponent;
});