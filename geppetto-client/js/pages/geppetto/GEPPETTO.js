/**
 *
 * @author Matteo Cantarelli
 * @authot Jesus R Martinez (jesus@metacell.us)
 */
define(function (require) {

  var $ = require('jquery'), _ = require('underscore');
  var THREEx = require('./THREEx.KeyboardState'); // Nothing to do with THREE
  var StoreManager = require('../../common/StoreManager').default;

  /*
   * These two libraries are required here so that Geppetto can work properly in an iframe (as embedded website).
   * Otherwise, sometimes (randomly)  these libraries are not loaded on time and some js commands failed and the web is not loaded properly.
   */
  require('jquery-ui-bundle');
  require('bootstrap');

  /**
   * Initialise Geppetto
   *
   * @class GEPPETTO
   */
  var GEPPETTO = {

    debug : false,
    keyboard : new THREEx.KeyboardState(),
    /**
     * @param{String} key - The pressed key
     * @returns {boolean} True if the key is pressed
     */
    isKeyPressed: function (key) {
      return this.keyboard.pressed(key);
    },


    /**
     * @param msg
     */
    log: function (msg) {
      if (GEPPETTO.debug) {
        var d = new Date();
        var curr_hour = d.getHours();
        var curr_min = d.getMinutes();
        var curr_sec = d.getSeconds();
        var curr_msec = d.getMilliseconds();
        console.log(curr_hour + ":" + curr_min + ":" + curr_sec + ":" + curr_msec + ' - ' + msg, "");
      }
    },

    /**
     * @param category
     * @param action
     * @param opt_label
     * @param opt_value
     * @param opt_noninteraction
     */
    trackActivity: function (category, action, opt_label, opt_value, opt_noninteraction) {
      if (typeof _gaq != 'undefined') {
        _gaq.push(['_trackEvent', category, action, opt_label, opt_value, opt_noninteraction]);
      }
    },

    winHeight: function () {
      return window.innerHeight || (document.documentElement || document.body).clientHeight;
    },

    trigger: function () {
      var args = [];
      Array.prototype.push.apply( args, arguments );
      if (args.length == 0){
        console.error("Trigger should be provided of the event to trigger");
        return;
      } else {
        _event = args.shift();
        StoreManager.actionsHandler[GEPPETTO.eventsMapping[_event]](...args);
      }
    },

    on: function () {
      console.warn("WARNING - This function has been removed due to the Redux refactoring.")
      console.warn("Please look into the PR 282 in geppetto-client and PR 52 in geppetto-application " +
        "for more information on how to migrate this to the new eventsCallback mechanism.");
    },

    off: function () {
      console.warn("WARNING - This function has been removed due to the Redux refactoring.")
      console.warn("Please look into the PR 282 in geppetto-client and PR 52 in geppetto-application " +
        "for more information on how to migrate this to the new eventsCallback mechanism.");
    },
  };

  GEPPETTO.Resources = require('@geppettoengine/geppetto-core/Resources').default;
  require('../../common/GEPPETTO.ViewController')(GEPPETTO);
  require('../../common/GEPPETTO.CommandController')(GEPPETTO);
  require('./GEPPETTO.Events').default(GEPPETTO);
  require('../../common/GEPPETTO.UserController')(GEPPETTO);
  require('./GEPPETTO.Flows')(GEPPETTO);
  require('../../common/GEPPETTO.ScriptRunner')(GEPPETTO);
  require('../../common/GEPPETTO.UnitsController')(GEPPETTO);

  GEPPETTO.LayoutManager = require('../../common/layout/LayoutManager').getInstance();
  GEPPETTO.ModalFactory = new(require('../../components/controls/modals/ModalFactory'))();
  GEPPETTO.SceneController = new(require('../../components/interface/3dCanvas/SceneController'))();

  require('../../common/GEPPETTO.Utility')(GEPPETTO);
  require('../../components/widgets/MenuManager')(GEPPETTO);
  require('../../communication/MessageSocket')(GEPPETTO);
  require('../../communication/GEPPETTO.GlobalHandler')(GEPPETTO);

  GEPPETTO.Manager = new(require('../../common/Manager').default)();

  require('../../communication/MessageHandler')(GEPPETTO);
  require('./G')(GEPPETTO);
  require('./GEPPETTO.Main')(GEPPETTO);
  require("../../components/widgets/includeWidget")(GEPPETTO);
  require('@geppettoengine/geppetto-core/ProjectFactory')(GEPPETTO);
  require('@geppettoengine/geppetto-core/ModelFactory').default(GEPPETTO);
  require('../../geppettoProject/ExperimentsController')(GEPPETTO);
  require('../../geppettoModel/QueriesController')(GEPPETTO);
  require('../../geppettoProject/ProjectsController')(GEPPETTO);

  eventsMapping = {
    [GEPPETTO.Events.Select]: StoreManager.clientActions.SELECT,
    [GEPPETTO.Events.Visibility_changed]: StoreManager.clientActions.VISIBILITY_CHANGED,
    [GEPPETTO.Events.Focus_changed]: StoreManager.clientActions.FOCUS_CHANGED,
    [GEPPETTO.Events.Experiment_over]: StoreManager.clientActions.EXPERIMENT_OVER,
    [GEPPETTO.Events.Project_loading]: StoreManager.clientActions.PROJECT_LOADING,
    [GEPPETTO.Events.Project_loaded]: StoreManager.clientActions.PROJECT_LOADED,
    [GEPPETTO.Events.Project_downloaded]: StoreManager.clientActions.PROJECT_DOWNLOADED,
    [GEPPETTO.Events.Model_loaded]: StoreManager.clientActions.MODEL_LOADED,
    [GEPPETTO.Events.Experiment_loaded]: StoreManager.clientActions.EXPERIMENT_LOADED,
    [GEPPETTO.Events.ModelTree_populated]: StoreManager.clientActions.MODELTREE_POPULATED,
    [GEPPETTO.Events.SimulationTree_populated]: StoreManager.clientActions.SIMULATIONTREE_POPULATED,
    [GEPPETTO.Events.Do_experiment_play]: StoreManager.clientActions.DO_EXPERIMENT_PLAY,
    [GEPPETTO.Events.Experiment_play]: StoreManager.clientActions.EXPERIMENT_PLAY,
    [GEPPETTO.Events.Experiment_status_check]: StoreManager.clientActions.EXPERIMENT_STATUS_CHECK,
    [GEPPETTO.Events.Experiment_pause]: StoreManager.clientActions.EXPERIMENT_PAUSE,
    [GEPPETTO.Events.Experiment_resume]: StoreManager.clientActions.EXPERIMENT_RESUME,
    [GEPPETTO.Events.Experiment_running]: StoreManager.clientActions.EXPERIMENT_RUNNING,
    [GEPPETTO.Events.Experiment_stop]: StoreManager.clientActions.EXPERIMENT_STOP,
    [GEPPETTO.Events.Experiment_completed]: StoreManager.clientActions.EXPERIMENT_COMPLETED,
    [GEPPETTO.Events.Experiment_failed]: StoreManager.clientActions.EXPERIMENT_FAILED,
    [GEPPETTO.Events.Experiment_update]: StoreManager.clientActions.EXPERIMENT_UPDATE,
    [GEPPETTO.Events.Experiment_updated]: StoreManager.clientActions.EXPERIMENT_UPDATED,
    [GEPPETTO.Events.Experiment_renamed]: StoreManager.clientActions.EXPERIMENT_RENAMED,
    [GEPPETTO.Events.Experiment_deleted]: StoreManager.clientActions.EXPERIMENT_DELETED,
    [GEPPETTO.Events.Experiment_active]: StoreManager.clientActions.EXPERIMENT_ACTIVE,
    [GEPPETTO.Events.Experiment_created]: StoreManager.clientActions.EXPERIMENT_CREATED,
    [GEPPETTO.Events.Project_persisted]: StoreManager.clientActions.PROJECT_PERSISTED,
    [GEPPETTO.Events.Spotlight_closed]: StoreManager.clientActions.SPOTLIGHT_CLOSED,
    [GEPPETTO.Events.Spotlight_loaded]: StoreManager.clientActions.SPOTLIGHT_LOADED,
    [GEPPETTO.Events.Instance_deleted]: StoreManager.clientActions.INSTANCE_DELETED,
    [GEPPETTO.Events.Instances_created]: StoreManager.clientActions.INSTANCES_CREATED,
    [GEPPETTO.Events.Instance_added]: StoreManager.clientActions.INSTANCE_ADDED,
    [GEPPETTO.Events.Show_Tutorial]: StoreManager.clientActions.SHOW_TUTORIAL,
    [GEPPETTO.Events.Hide_Tutorial]: StoreManager.clientActions.HIDE_TUTORIAL,
    [GEPPETTO.Events.Show_spinner]: StoreManager.clientActions.SHOW_SPINNER,
    [GEPPETTO.Events.Hide_spinner]: StoreManager.clientActions.HIDE_SPINNER,
    [GEPPETTO.Events.Color_set]: StoreManager.clientActions.COLOR_SET,
    [GEPPETTO.Events.Canvas_initialised]: StoreManager.clientActions.CANVAS_INITIALISED,
    [GEPPETTO.Events.Project_made_public]: StoreManager.clientActions.PROJECT_MADE_PUBLIC,
    [GEPPETTO.Events.Control_panel_open]: StoreManager.clientActions.CONTROL_PANEL_OPEN,
    [GEPPETTO.Events.Control_panel_close]: StoreManager.clientActions.CONTROL_PANEL_CLOSE,
    [GEPPETTO.Events.Lit_entities_changed]: StoreManager.clientActions.LIT_ENTITIES_CHANGED,
    [GEPPETTO.Events.Component_destroyed]: StoreManager.clientActions.COMPONENT_DESTROYED,
    [GEPPETTO.Events.Experiment_properties_saved]: StoreManager.clientActions.EXPERIMENT_PROPERTIES_SAVED,
    [GEPPETTO.Events.Project_properties_saved]: StoreManager.clientActions.PROJECT_PROPERTIES_SAVED,
    [GEPPETTO.Events.Parameters_set]: StoreManager.clientActions.PARAMETERS_SET,
    [GEPPETTO.Events.Command_log]: StoreManager.clientActions.COMMAND_LOG,
    [GEPPETTO.Events.Command_log_debug]: StoreManager.clientActions.COMMAND_LOG_DEBUG,
    [GEPPETTO.Events.Command_log_run]: StoreManager.clientActions.COMMAND_LOG_RUN,
    [GEPPETTO.Events.Command_clear]: StoreManager.clientActions.COMMAND_CLEAR,
    [GEPPETTO.Events.Command_toggle_implicit]: StoreManager.clientActions.COMMAND_TOGGLE_IMPLICIT,
    [GEPPETTO.Events.Receive_Python_Message]: StoreManager.clientActions.RECEIVE_PYTHON_MESSAGE,
    [GEPPETTO.Events.Websocket_disconnected]: StoreManager.clientActions.WEBSOCKET_DISCONNECTED,
    [GEPPETTO.Events.Error_while_exec_python_command]: StoreManager.clientActions.ERROR_WHILE_EXEC_PYTHON_COMMAND,
    [GEPPETTO.Events.Update_camera]: StoreManager.clientActions.UPDATE_CAMERA,
  };

  return GEPPETTO;

});
