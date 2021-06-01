define(function (require) {

  var React = require('react');
  var CreateClass = require('create-react-class');

  var RunButton = require('./buttons/RunButton');
  var PlayButton = require('./buttons/PlayButton');
  var PauseButton = require('./buttons/PauseButton');
  var StopButton = require('./buttons/StopButton');
  var HelpButton = require('./buttons/HelpButton');
  var MenuButton = require('../../controls/menuButton/MenuButton');
  var StoreManager = require('@geppettoengine/geppetto-client/common/StoreManager').default

  var GEPPETTO = require('geppetto');

  require('./SimulationControls.less');

  var SimulationControls = CreateClass({

    getInitialState: function () {
      return {
        disableRun: true,
        disablePlay: true,
        disablePause: true,
        disableStop: true,
        experimentStatus: undefined,
        projectStatus: undefined,
      }
    },

    getDefaultProps: function () {
      return {
        hideHelp: false,
        hideRun: false,
        hidePlay: false,
        hidePause: false,
        hideStop: false
      };
    },

    permissions : function (){
      var experiment = window.Project.getActiveExperiment();
      var writePermission = GEPPETTO.UserController.hasPermission(GEPPETTO.Resources.WRITE_PROJECT);
      var runPermission = GEPPETTO.UserController.hasPermission(GEPPETTO.Resources.RUN_EXPERIMENT);
      var projectPersisted = experiment.getParent().persisted;
      var login = GEPPETTO.UserController.isLoggedIn() && GEPPETTO.UserController.hasPersistence();
      var readOnlyProject = window.Project.isReadOnly();

      if (writePermission && runPermission && projectPersisted && login && !readOnlyProject){
        return true;
      }

      return false;
    },

    UNSAFE_componentWillReceiveProps: function (nextProps) {
      if (nextProps.controlsDisabled && nextProps.controlsDisabled !== this.props.controlsDisabled) {
        this.setState({ disableRun: true, disablePlay: true, disablePause: true, disableStop: true });
      }

      if ((nextProps.experimentStatus !== this.props.experimentStatus)) {
        switch (nextProps.experimentStatus) {
        case StoreManager.clientActions.EXPERIMENT_FAILED:
          var activeExperiment = window.Project.getActiveExperiment();
          if (activeExperiment != null || undefined){
            if (activeExperiment.getId() == nextProps.experimentId){
              this.setState({ disableRun: false, disablePlay: true, disablePause: true, disableStop: true });
            }
          }
          break;
        case StoreManager.clientActions.EXPERIMENT_DELETED:
          var experiment = window.Project.getActiveExperiment();
          if (experiment == null || undefined){
            this.setState({ disableRun: true, disablePlay: true, disablePause: true, disableStop: true });
          }
          break;
        default:
          this.updateStatus();
        }
      }

      if (nextProps.projectStatus !== this.props.projectStatus) {
        this.updateStatus();
      }
    },

    componentDidMount: function () {
      var self = this;

      this.updateStatus();
    },

    updateStatus:function (){
      var experiment = window.Project.getActiveExperiment();

      if (experiment != null || undefined){
        if (experiment.getStatus() == GEPPETTO.Resources.ExperimentStatus.COMPLETED) {
          if (GEPPETTO.ExperimentsController.isPaused()){
            this.setState({ disableRun: true, disablePlay: false, disablePause: true, disableStop: false });
          } else if (GEPPETTO.ExperimentsController.isPlaying()){
            this.setState({ disableRun: true, disablePlay: true, disablePause: false, disableStop: false });
          } else if (GEPPETTO.ExperimentsController.isStopped()){
            this.setState({ disableRun: true, disablePlay: false, disablePause: true, disableStop: true });
          }
        } else if (experiment.getStatus() == GEPPETTO.Resources.ExperimentStatus.RUNNING) {
          this.setState({ disableRun: true, disablePlay: true, disablePause: true, disableStop: true });
        } else if (experiment.getStatus() == GEPPETTO.Resources.ExperimentStatus.ERROR) {
          if (this.permissions()){
            this.setState({ disableRun: false, disablePlay: true, disablePause: true, disableStop: true });
          } else {
            this.setState({ disableRun: true, disablePlay: true, disablePause: true, disableStop: true });
          }
        } else if (experiment.getStatus() == GEPPETTO.Resources.ExperimentStatus.DESIGN) {
          if (this.permissions()){
            this.setState({ disableRun: false, disablePlay: true, disablePause: true, disableStop: true });
          } else {
            this.setState({ disableRun: true, disablePlay: true, disablePause: true, disableStop: true });
          }
        }
      }
    },

    render: function () {

      var runButton = "";
      if (this.props.runConfiguration != undefined){
        this.props.runConfiguration.buttonDisabled = this.state.disableRun;
        runButton = <MenuButton configuration={this.props.runConfiguration} />
      } else {
        runButton = <RunButton disabled={this.state.disableRun} hidden={this.props.hideRun}/>
      }

      return (
        <div className="simulation-controls">
          <HelpButton disabled={false} hidden={this.props.hideHelp}/>
          <StopButton disabled={this.state.disableStop} hidden={this.props.hideStop}/>
          <PauseButton disabled={this.state.disablePause} hidden={this.props.hidePause}/>
          <PlayButton disabled={this.state.disablePlay} hidden={this.props.hidePlay}/>
          {runButton}
        </div>
      );
    }

  });

  return SimulationControls;
});
