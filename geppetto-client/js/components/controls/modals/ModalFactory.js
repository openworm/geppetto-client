define(['jquery'], function () {

  var $ = require('jquery');
  var React = require('react');
  var InfoModal = require('./InfoModal');
  var ErrorModal = require('./ErrorModal');
  var InputModal = require('./InputModal');
  require('../mixins/bootstrap/modal.js')
  var ReactDOM = require('react-dom');


  function ModalFactory () {

  }

  ModalFactory.prototype
    = {

      constructor: ModalFactory,

      /**
       * Basic Dialog box with message to display.
       *
       * @method
       *
       * @param title -
       *            Title of message
       * @param msg -
       *            Message to display
       * @param autoCloseMs -
       *            optional. If set, the dialog dismisses itself after this
       *            many ms instead of waiting for the user to click Ok.
       * @param onAutoClose -
       *            optional. Called once, after the auto-dismiss above. Not
       *            called if the user dismisses the dialog manually first.
       */
      infoDialog: function (title, msg, autoCloseMs, onAutoClose) {
        var infoFactory = React.createFactory(InfoModal);

        ReactDOM.render(
          infoFactory(
            {
              show: true,
              keyboard: false,
              title: title,
              text: msg,
            }),

          document.getElementById('modal-region')
        );

        if (autoCloseMs) {
          setTimeout(function () {
            $('#infomodal').modal('hide');
            if (typeof onAutoClose === 'function') {
              onAutoClose();
            }
          }, autoCloseMs);
        }
      },


      /**
       * Dialog box with two buttons (e.g. yes/no)
       *
       * @method
       *
       * @param title -
       *            Title of message
       * @param msg -
       *            Message to display
       */
      inputDialog: function (title, msg, aLabel, aClick, bLabel, bClick, form) {
        var inputFactory = React.createFactory(InputModal);

        ReactDOM.render(
          inputFactory(
            {
              show: true,
              keyboard: false,
              form: form,
              title: title,
              text: msg,
              aLabel: aLabel,
              aClick: aClick,
              bLabel: bLabel,
              bClick: bClick
            }),

          document.getElementById('modal-region')
        );
      },

      /**
       * Dialog box to display error messages.
       *
       * @method
       *
       * @param title -
       *            Notifying error
       * @param msg -
       *            Message to display for error
       * @param code -
       *            Error code of message
       * @param source -
       *            Source error to display
       * @param exception -
       *            Exception to display
       */
      errorDialog: function (title, message, code, exception) {
        var errorModalFactory = React.createFactory(ErrorModal);

        ReactDOM.render(
          errorModalFactory(
            {
              show: true,
              keyboard: false,
              title: title,
              message: message,
              code: code,
              exception: exception
            }),
          document.getElementById('modal-region')
        );
      }


    };

  return ModalFactory;
});
