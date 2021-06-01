/**
 * Geppetto redux store manager
 *
 * Dario Del Piano
 */

const newStore = require('./store/store').default;
const { clientActions } = require('./actions/actions');
const { callbacksList } = require('./middleware/geppettoMiddleware');
const {
  selectInstance,
  visibilityChanged,
  focusChanged,
  modelLoaded,
  projectLoading,
  projectLoaded,
  projectDownloaded,
  projectPersisted,
  projectConfigLoaded,
  experimentOver,
  experimentLoaded,
  experimentPlay,
  experimentStatusCheck,
  experimentPause,
  experimentResume,
  experimentRunning,
  experimentStop,
  experimentCompleted,
  experimentFailed,
  experimentUpdate,
  experimentUpdated,
  experimentRenamed,
  experimentDeleted,
  experimentActive,
  experimentCreated,
  spotlightClosed,
  spotlightLoaded,
  instanceDeleted,
  instancesCreated,
  showTutorial,
  hideTutorial,
  startTutorial,
  stopTutorial,
  showQueryBuilder,
  hideQueryBuilder,
  showSpinner,
  hideSpinner,
  showHelp,
  hideHelp,
  colorSet,
  canvasInitialised,
  projectMadePublic,
  controlPanelOpen,
  controlPanelClose,
  litEntitiesChanged,
  componentDestroyed,
  experimentPropertiesSaved,
  projectPropertiesSaved,
  parametersSet,
  commandLog,
  commandLogDebug,
  commandLogRun,
  commandClear,
  commandToggleImplicit,
  receivePythonMessage,
  errorWhileExecPythonCommand,
  websocketDisconnected,
  updateCamera,
  stopLogo,
  spinLogo,
  geppettoInfo,
  geppettoError,
  stopPersist,
  spinPersist,
  jupyterGeppettoExtensionReady,
  disableControls,
} = require('./actions/actions');


const GeppettoStore = newStore();



var StoreManager = (function () {
  var instance;

  function init () {
    // Private methods and variables

    return {
      // Public methods and variables
      store: GeppettoStore,
      clientActions: clientActions,
      eventsCallback: callbacksList,
      actionsHandler: {
        [clientActions.SELECT]: (scope, geometryIdentifier, point ) => (
          GeppettoStore.dispatch(selectInstance(scope, geometryIdentifier, point))
        ),
        [clientActions.VISIBILITY_CHANGED]: instance => (
          GeppettoStore.dispatch(visibilityChanged(instance))
        ),
        [clientActions.FOCUS_CHANGED]: instance => (
          GeppettoStore.dispatch(focusChanged(instance))
        ),
        [clientActions.MODEL_LOADED]: () => (
          GeppettoStore.dispatch(modelLoaded())
        ),
        [clientActions.PROJECT_LOADING]: () => (
          GeppettoStore.dispatch(projectLoading())
        ),
        [clientActions.PROJECT_LOADED]: () => (
          GeppettoStore.dispatch(projectLoaded())
        ),
        [clientActions.PROJECT_DOWNLOADED]: () => (
          GeppettoStore.dispatch(projectDownloaded())
        ),
        [clientActions.PROJECT_CONFIG_LOADED]: configuration => (
          GeppettoStore.dispatch(projectConfigLoaded(configuration))
        ),
        [clientActions.EXPERIMENT_OVER]: experiment => (
          GeppettoStore.dispatch(experimentOver(experiment))
        ),
        [clientActions.EXPERIMENT_LOADED]: () => (
          GeppettoStore.dispatch(experimentLoaded())
        ),
        [clientActions.EXPERIMENT_PLAY]: parameters => (
          GeppettoStore.dispatch(experimentPlay(parameters))
        ),
        [clientActions.EXPERIMENT_PAUSE]: () => (
          GeppettoStore.dispatch(experimentPause())
        ),
        [clientActions.EXPERIMENT_RESUME]: () => (
          GeppettoStore.dispatch(experimentResume())
        ),
        [clientActions.EXPERIMENT_STATUS_CHECK]: () => (
          GeppettoStore.dispatch(experimentStatusCheck())
        ),
        [clientActions.EXPERIMENT_RUNNING]: id => (
          GeppettoStore.dispatch(experimentRunning(id))
        ),
        [clientActions.EXPERIMENT_STOP]: () => (
          GeppettoStore.dispatch(experimentStop())
        ),
        [clientActions.EXPERIMENT_COMPLETED]: id => (
          GeppettoStore.dispatch(experimentCompleted(id))
        ),
        [clientActions.EXPERIMENT_FAILED]: id => (
          GeppettoStore.dispatch(experimentFailed(id))
        ),
        [clientActions.EXPERIMENT_UPDATE]: parameters => (
          GeppettoStore.dispatch(experimentUpdate(parameters))
        ),
        [clientActions.EXPERIMENT_UPDATED]: () => (
          GeppettoStore.dispatch(experimentUpdated())
        ),
        [clientActions.EXPERIMENT_RENAMED]: () => (
          GeppettoStore.dispatch(experimentRenamed())
        ),
        [clientActions.EXPERIMENT_DELETED]: id => (
          GeppettoStore.dispatch(experimentDeleted(id))
        ),
        [clientActions.EXPERIMENT_ACTIVE]: () => (
          GeppettoStore.dispatch(experimentActive())
        ),
        [clientActions.EXPERIMENT_CREATED]: id => (
          GeppettoStore.dispatch(experimentCreated(id))
        ),
        [clientActions.PROJECT_PERSISTED]: () => (
          GeppettoStore.dispatch(projectPersisted())
        ),
        [clientActions.SPOTLIGHT_CLOSED]: () => (
          GeppettoStore.dispatch(spotlightClosed())
        ),
        [clientActions.SPOTLIGHT_LOADED]: () => (
          GeppettoStore.dispatch(spotlightLoaded())
        ),
        [clientActions.INSTANCE_DELETED]: instancePath => (
          GeppettoStore.dispatch(instanceDeleted(instancePath))
        ),
        [clientActions.INSTANCES_CREATED]: instances => (
          GeppettoStore.dispatch(instancesCreated(instances))
        ),
        [clientActions.SHOW_TUTORIAL]: () => (
          GeppettoStore.dispatch(showTutorial())
        ),
        [clientActions.HIDE_TUTORIAL]: () => (
          GeppettoStore.dispatch(hideTutorial())
        ),
        [clientActions.START_TUTORIAL]: () => (
          GeppettoStore.dispatch(startTutorial())
        ),
        [clientActions.STOP_TUTORIAL]: () => (
          GeppettoStore.dispatch(stopTutorial())
        ),
        [clientActions.SHOW_QUERYBUILDER]: () => (
          GeppettoStore.dispatch(showQueryBuilder())
        ),
        [clientActions.HIDE_QUERYBUILDER]: () => (
          GeppettoStore.dispatch(hideQueryBuilder())
        ),
        [clientActions.SHOW_SPINNER]: message => (
          GeppettoStore.dispatch(showSpinner(message))
        ),
        [clientActions.HIDE_SPINNER]: () => (
          GeppettoStore.dispatch(hideSpinner())
        ),
        [clientActions.SHOW_HELP]: () => (
          GeppettoStore.dispatch(showHelp())
        ),
        [clientActions.HIDE_HELP]: () => (
          GeppettoStore.dispatch(hideHelp())
        ),
        [clientActions.COLOR_SET]: parameters => (
          GeppettoStore.dispatch(colorSet(parameters))
        ),
        [clientActions.CANVAS_INITIALISED]: () => (
          GeppettoStore.dispatch(canvasInitialised())
        ),
        [clientActions.PROJECT_MADE_PUBLIC]: () => (
          GeppettoStore.dispatch(projectMadePublic())
        ),
        [clientActions.CONTROL_PANEL_OPEN]: () => (
          GeppettoStore.dispatch(controlPanelOpen())
        ),
        [clientActions.CONTROL_PANEL_CLOSE]: () => (
          GeppettoStore.dispatch(controlPanelClose())
        ),
        [clientActions.LIT_ENTITIES_CHANGED]: () => (
          GeppettoStore.dispatch(litEntitiesChanged())
        ),
        [clientActions.COMPONENT_DESTROYED]: () => (
          GeppettoStore.dispatch(componentDestroyed())
        ),
        [clientActions.EXPERIMENT_PROPERTIES_SAVED]: () => (
          GeppettoStore.dispatch(experimentPropertiesSaved())
        ),
        [clientActions.PROJECT_PROPERTIES_SAVED]: () => (
          GeppettoStore.dispatch(projectPropertiesSaved())
        ),
        [clientActions.PARAMETERS_SET]: () => (
          GeppettoStore.dispatch(parametersSet())
        ),
        [clientActions.COMMAND_LOG]: message => (
          GeppettoStore.dispatch(commandLog(message))
        ),
        [clientActions.COMMAND_LOG_DEBUG]: message => (
          GeppettoStore.dispatch(commandLogDebug(message))
        ),
        [clientActions.COMMAND_LOG_RUN]: message => (
          GeppettoStore.dispatch(commandLogRun(message))
        ),
        [clientActions.COMMAND_CLEAR]: () => (
          GeppettoStore.dispatch(commandClear())
        ),
        [clientActions.COMMAND_TOGGLE_IMPLICIT]: () => (
          GeppettoStore.dispatch(commandToggleImplicit())
        ),
        [clientActions.RECEIVE_PYTHON_MESSAGE]: data => (
          GeppettoStore.dispatch(receivePythonMessage(data))
        ),
        [clientActions.ERROR_WHILE_EXEC_PYTHON_COMMAND]: data => (
          GeppettoStore.dispatch(errorWhileExecPythonCommand(data))
        ),
        [clientActions.WEBSOCKET_DISCONNECTED]: () => (
          GeppettoStore.dispatch(websocketDisconnected())
        ),
        [clientActions.UPDATE_CAMERA]: () => (
          GeppettoStore.dispatch(updateCamera())
        ),
        [clientActions.STOP_LOGO]: () => (
          GeppettoStore.dispatch(stopLogo())
        ),
        [clientActions.SPIN_LOGO]: () => (
          GeppettoStore.dispatch(spinLogo())
        ),
        [clientActions.GEPPETTO_ERROR]: message => (
          GeppettoStore.dispatch(geppettoError(message))
        ),
        [clientActions.GEPPETTO_INFO]: message => (
          GeppettoStore.dispatch(geppettoInfo(message))
        ),
        [clientActions.STOP_PERSIST]: () => (
          GeppettoStore.dispatch(stopPersist())
        ),
        [clientActions.SPIN_PERSIST]: () => (
          GeppettoStore.dispatch(spinPersist())
        ),
        [clientActions.JUPYTER_GEPPETTO_EXTENSION_READY]: () => (
          GeppettoStore.dispatch(jupyterGeppettoExtensionReady())
        ),
        [clientActions.DISABLE_CONTROLS]: () => (
          GeppettoStore.dispatch(disableControls())
        ),
      },

      select: function (scope, geometryIdentifier, point ) {
        this.actionsHandler[clientActions.SELECT](scope, geometryIdentifier, point )
      },

      changeVisibility: function (instance) {
        this.actionsHandler[clientActions.VISIBILITY_CHANGED](instance)
      },

      changeFocus: function (instance) {
        this.actionsHandler[clientActions.FOCUS_CHANGED](instance)
      },

      modelLoaded: function () {
        this.actionsHandler[clientActions.MODEL_LOADED]()
      },

      projectLoaded: function () {
        this.actionsHandler[clientActions.PROJECT_LOADED]()
      },

      projectDownloaded: function () {
        this.actionsHandler[clientActions.PROJECT_DOWNLOADED]()
      },

      projectConfigLoaded: function (configuration) {
        this.actionsHandler[clientActions.PROJECT_CONFIG_LOADED](configuration)
      },

      experimentOver: function (experiment) {
        this.actionsHandler[clientActions.EXPERIMENT_OVER](experiment)
      },

      experimentLoaded: function () {
        this.actionsHandler[clientActions.EXPERIMENT_LOADED]()
      },

      playExperiment: function (parameters) {
        this.actionsHandler[clientActions.EXPERIMENT_PLAY](parameters)
      },

      pauseExperiment: function () {
        this.actionsHandler[clientActions.EXPERIMENT_PAUSE]()
      },

      resumeExperiment: function () {
        this.actionsHandler[clientActions.EXPERIMENT_RESUME]()
      },

      experimentStatusCheck: function () {
        this.actionsHandler[clientActions.EXPERIMENT_STATUS_CHECK]()
      },

      experimentRunning: function (id) {
        this.actionsHandler[clientActions.EXPERIMENT_RUNNING](id)
      },

      stopExperiment: function () {
        this.actionsHandler[clientActions.EXPERIMENT_STOP]()
      },

      experimentCompleted: function (id) {
        this.actionsHandler[clientActions.EXPERIMENT_COMPLETED](id)
      },

      experimentFailed: function (id) {
        this.actionsHandler[clientActions.EXPERIMENT_FAILED](id)
      },

      updateExperiment: function (parameters) {
        this.actionsHandler[clientActions.EXPERIMENT_UPDATE](parameters)
      },

      experimentUpdated: function () {
        this.actionsHandler[clientActions.EXPERIMENT_UPDATED]()
      },

      experimentRenamed: function () {
        this.actionsHandler[clientActions.EXPERIMENT_RENAMED]()
      },

      experimentDeleted: function (id) {
        this.actionsHandler[clientActions.EXPERIMENT_DELETED](id)
      },

      activeExperiment: function () {
        this.actionsHandler[clientActions.EXPERIMENT_ACTIVE]()
      },

      experimentCreated: function (id) {
        this.actionsHandler[clientActions.EXPERIMENT_CREATED](id)
      },

      projectPersisted: function () {
        this.actionsHandler[clientActions.PROJECT_PERSISTED]()
      },

      spotlightClosed: function () {
        this.actionsHandler[clientActions.SPOTLIGHT_CLOSED]()
      },

      spotlightLoaded: function () {
        this.actionsHandler[clientActions.SPOTLIGHT_LOADED]()
      },

      instanceDeleted: function (instancePath) {
        this.actionsHandler[clientActions.INSTANCE_DELETED](instancePath)
      },

      instancesCreated: function (instances) {
        this.actionsHandler[clientActions.INSTANCES_CREATED](instances)
      },

      showTutorial: function () {
        this.actionsHandler[clientActions.SHOW_TUTORIAL]()
      },

      hideTutorial: function () {
        this.actionsHandler[clientActions.HIDE_TUTORIAL]()
      },

      startTutorial: function () {
        this.actionsHandler[clientActions.START_TUTORIAL]()
      },

      stopTutorial: function () {
        this.actionsHandler[clientActions.STOP_TUTORIAL]()
      },

      showQueryBuilder: function () {
        this.actionsHandler[clientActions.SHOW_QUERYBUILDER]()
      },

      hideQueryBuilder: function () {
        this.actionsHandler[clientActions.HIDE_QUERYBUILDER]()
      },

      showSpinner: function (message) {
        this.actionsHandler[clientActions.SHOW_SPINNER](message)
      },

      showHelp: function () {
        this.actionsHandler[clientActions.SHOW_HELP]()
      },

      hideHelp: function () {
        this.actionsHandler[clientActions.HIDE_HELP]()
      },

      setColor: function (parameters) {
        this.actionsHandler[clientActions.COLOR_SET](parameters)
      },

      canvasInitialised: function () {
        this.actionsHandler[clientActions.CANVAS_INITIALISED]()
      },

      projectMadePublic: function () {
        this.actionsHandler[clientActions.PROJECT_MADE_PUBLIC]()
      },

      openControlPanel: function () {
        this.actionsHandler[clientActions.CONTROL_PANEL_OPEN]()
      },

      closeControlPanel: function () {
        this.actionsHandler[clientActions.CONTROL_PANEL_CLOSE]()
      },

      litEntitiesChanged: function () {
        this.actionsHandler[clientActions.LIT_ENTITIES_CHANGED]()
      },

      componentDestroyed: function () {
        this.actionsHandler[clientActions.COMPONENT_DESTROYED]()
      },

      experimentPropertiesSaved: function () {
        this.actionsHandler[clientActions.EXPERIMENT_PROPERTIES_SAVED]()
      },

      projectPropertiesSaved: function () {
        this.actionsHandler[clientActions.PROJECT_PROPERTIES_SAVED]()
      },

      parametersSet: function () {
        this.actionsHandler[clientActions.PARAMETERS_SET]()
      },

      commandLog: function (message) {
        this.actionsHandler[clientActions.COMMAND_LOG](message)
      },

      commandLogDebug: function (message) {
        this.actionsHandler[clientActions.COMMAND_LOG_DEBUG](message)
      },

      commandLogRun: function (message) {
        this.actionsHandler[clientActions.COMMAND_LOG_RUN](message)
      },

      commandClear: function () {
        this.actionsHandler[clientActions.COMMAND_CLEAR]()
      },

      commandToggleImplicit: function () {
        this.actionsHandler[clientActions.COMMAND_TOGGLE_IMPLICIT]()
      },

      receivePythonMessage: function (data) {
        this.actionsHandler[clientActions.RECEIVE_PYTHON_MESSAGE](data)
      },

      errorWhileExecPythonCommand: function (data) {
        this.actionsHandler[clientActions.ERROR_WHILE_EXEC_PYTHON_COMMAND](data)
      },

      websocketDisconnected: function () {
        this.actionsHandler[clientActions.WEBSOCKET_DISCONNECTED]()
      },

      updateCamera: function () {
        this.actionsHandler[clientActions.UPDATE_CAMERA]()
      },

      stopLogo: function () {
        this.actionsHandler[clientActions.STOP_LOGO]()
      },

      spinLogo: function () {
        this.actionsHandler[clientActions.SPIN_LOGO]()
      },

      geppettoError: function (message) {
        this.actionsHandler[clientActions.GEPPETTO_ERROR](message)
      },

      geppettoInfo: function (message) {
        this.actionsHandler[clientActions.GEPPETTO_INFO](message)
      },

      stopPersist: function () {
        this.actionsHandler[clientActions.STOP_PERSIST]()
      },

      spinPersist: function () {
        this.actionsHandler[clientActions.SPIN_PERSIST]()
      },

      jupyterGeppettoExtensionReady: function () {
        this.actionsHandler[clientActions.JUPYTER_GEPPETTO_EXTENSION_READY]()
      },

      disableControls: function () {
        this.actionsHandler[clientActions.DISABLE_CONTROLS]()
      },

      injectReducer: function (key, reducer) {
        GeppettoStore.reducerManager.add(key, reducer);
        return this.store;
      }
    };
  }

  return {
    getInstance: function () {
      if (instance == null) {
        instance = init();
        // Hide the constructor so the returned object can't be new'd...
        instance.constructor = null;
      }
      return instance;
    },
  }
})();

const GeppettoStoreManager = StoreManager.getInstance();

export default GeppettoStoreManager
