define(function (require) {

  var React = require('react');
  var CreateClass = require('create-react-class');
  var GEPPETTO = require('geppetto');
  var StoreManager = require('@geppettoengine/geppetto-client/common/StoreManager').default

  $.widget.bridge('uitooltip', $.ui.tooltip);

  var saveControlComp = CreateClass({
    projectStatus: null,

    attachTooltip: function () {
      var self = this;
      $('.SaveButton').uitooltip({
        position: { my: "right center", at: "left-25 center" },
        tooltipClass: "tooltip-persist",
        show: {
          effect: "slide",
          direction: "right",
          delay: 200
        },
        hide: {
          effect: "slide",
          direction: "right",
          delay: 200
        },
        content: function () {
          return self.state.tooltipLabel;
        },
      });
    },

    getInitialState: function () {
      return {
        disableSave: true,
        tooltipLabel: "Click here to persist this project!",
        icon: "fa fa-star"
      };
    },

    UNSAFE_componentWillReceiveProps: function (nextProps) {
      if (this.props.projectStatus !== nextProps.projectStatus) {
        switch (nextProps.projectStatus) {
        case StoreManager.clientActions.PROJECT_LOADED:
          this.setState(this.evaluateState());
          break;
        case StoreManager.clientActions.PROJECT_PERSISTED:
          this.setState({ disableSave: false });
          // update contents of what's displayed on tooltip
          $('.SaveButton').uitooltip({
            content: "The project was persisted and added to your dashboard!",
            position: { my: "right center", at: "left center" }
          });
          $(".SaveButton").mouseover().delay(2000).queue(function () {
            $(this).mouseout().dequeue();
          });
          this.setState({ disableSave: true });
          break;
        default:
          break;
        }
      }

      if (nextProps.spinPersistRunning) {
        this.setState({ icon: "fa fa-star fa-spin" });
      } else {
        this.setState({ icon: "fa fa-star" });
      }
    },

    componentDidMount: function () {

      var self = this;

      self.attachTooltip();

      if (window.Project != undefined) {
        this.setState(this.evaluateState());
      }
    },

    evaluateState: function () {
      return { disableSave: window.Project.persisted || !GEPPETTO.UserController.hasPermission(GEPPETTO.Resources.WRITE_PROJECT) };
    },

    clickEvent: function () {
      var self = this;
      // update contents of what's displayed on tooltip
      $('.SaveButton').uitooltip({ content: "The project is getting persisted..." });
      $(".SaveButton").mouseover().delay(2000).queue(function () {
        $(this).mouseout().dequeue();
      });
      self.setState({ disableSave: true });
      GEPPETTO.CommandController.execute("Project.persist();");
      this.props.spinPersist();
    },

    render: function () {
      return (
        <div className="saveButton">
          <button className="btn SaveButton pull-right" type="button" title=''
            rel="tooltip" onClick={this.clickEvent} disabled={this.state.disableSave}>
            <i className={this.state.icon}></i>
          </button>
        </div>
      );
    }
  });

  return saveControlComp;

});
