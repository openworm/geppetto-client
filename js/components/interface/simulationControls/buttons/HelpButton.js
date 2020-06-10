define(function (require) {

  var React = require('react'),
    CreateClass = require('create-react-class'),
    ReactDOM = require('react-dom'),
    GEPPETTO = require('geppetto'),
    $ = require('jquery'),
    HelpModal = require('../HelpModal');

  return CreateClass({
    mixins: [require('../../../controls/mixins/Button')],

    componentDidMount: function () {
      GEPPETTO.StoreManager.eventsCallback[GEPPETTO.StoreManager.clientActions.SHOW_HELP].list.push(action => {
        ReactDOM.render(React.createFactory(HelpModal)({ show:true }), document.getElementById('modal-region'));

        $("#help-modal").css("margin-right", "-20px");
        $('#help-modal').css('max-height', $(window).height() * 0.7);
        $('#help-modal .modal-body').css('max-height', $(window).height() * 0.5);
      });
    },

    getDefaultProps: function () {
      return {
        label: 'Help',
        id: 'genericHelpBtn',
        className: 'pull-right help-button',
        icon:'fa fa-info-circle',
        onClick: function (){
          // GEPPETTO.CommandController.execute("G.showHelpWindow(true)", true);
          GEPPETTO.StoreManager.actionsHandler[GEPPETTO.StoreManager.clientActions.SHOW_HELP]();
        }
      }
    }
  });
});
