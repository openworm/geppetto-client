define(function (require) {

  require('./Logo.less');

  var React = require('react');
  var CreateClass = require('create-react-class');
  var GEPPETTO = require('geppetto');

  var logoDiv = CreateClass({

    UNSAFE_componentWillReceiveProps: function (nextProps) {
      if (nextProps.logoSpinning) {
        $("#geppettologo").addClass("fa-spin").attr('title', 'Loading data');
      } else {
        $("#geppettologo").removeClass("fa-spin").attr('title', '');
      }
    },

    render: function () {
      return (
        <div id={this.props.id} className={this.props.logo} style={this.props.propStyle}></div>
      );
    }
  });

  return logoDiv;
});
