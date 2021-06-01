import { clientActions } from '../actions/actions';
import StoreManager from '@geppettoengine/geppetto-client/common/StoreManager';

export const callbacksList = {}
for ( const action in clientActions ) {
  callbacksList [action] = { 'list': []}
}

export function callbacksMiddleware ({ getState, dispatch }) {
  return function (next) {
    return function (action) {
      var actionTriggered = false;
      if (callbacksList[action.type] !== undefined && callbacksList[action.type].list.length > 0) {
        callbacksList[action.type].list.map(item => {
          item(action);
        });
      }

      switch (action.type) {
      case clientActions.SELECT:
        // FIXME: do we really need the action focus changed? this can be handled directly by the SELECT action itself
        StoreManager.actionsHandler[StoreManager.clientActions.FOCUS_CHANGED](action.data.scope);
        // FIXME: do we need to use the widgetsListener?
        GEPPETTO.WidgetsListener.update(GEPPETTO.Events.Select);
        break;
      case clientActions.DO_EXPERIMENT_PLAY:
        Project.getActiveExperiment().playAll();
        break;
      case clientActions.EXPERIMENT_ACTIVE:
        GEPPETTO.WidgetsListener.update(GEPPETTO.WidgetsListener.WIDGET_EVENT_TYPE.DELETE);
        break;
      case clientActions.EXPERIMENT_PLAY:
        GEPPETTO.WidgetsListener.update(GEPPETTO.Events.Experiment_play, action.data.parameters);
        break;
      case clientActions.EXPERIMENT_LOADED:
        // From the ProjectController
        GEPPETTO.ProjectsController.refreshUserProjects();
        // From the GEPPETTO.Events
        if (GEPPETTO.UserController.isLoggedIn()) {
          StoreManager.actionsHandler[StoreManager.clientActions.HIDE_SPINNER]();
        }
        break;
      case clientActions.EXPERIMENT_OVER:
        GEPPETTO.WidgetsListener.update(GEPPETTO.Events.Experiment_over);
        var id = action.data.experiment.id;
        var name = action.data.experiment.name;
        if (GEPPETTO.ExperimentsController.playLoop === true) {
          Project.getActiveExperiment().play({ step: 1 });
        } else {
          GEPPETTO.CommandController.log("Experiment " + name + " with " + id + " is over ");
        }
        break;
      case clientActions.EXPERIMENT_UPDATE:
        /*
         * This fix the tons of experiment_update action updates we trigger durint the experiment.
         *
         * if (this.getState().client.experiment.status === clientActions.EXPERIMENT_UPDATE) {
         *   actionTriggered = true;
         * }
         */
        GEPPETTO.WidgetsListener.update(GEPPETTO.Events.Experiment_update, action.data.parameters);
        break;
      case clientActions.PROJECT_LOADED:
        GEPPETTO.Main.startStatusWorker();
        break;
      case clientActions.SPOTLIGHT_CLOSED:
        GEPPETTO.Flows.onSpotlightExitFlowCallback();
        break;
      case clientActions.LIT_ENTITIES_CHANGED:
        GEPPETTO.WidgetsListener.update(GEPPETTO.Events.Lit_entities_changed, undefined);
        break;
      case clientActions.COMPONENT_DESTROYED:
        GEPPETTO.ViewController.anyComponentsDestroyed = true;
        break;
      default:
        break;
      }

      if (!actionTriggered) {
        next(action);
      }
      return;
    }
  }
}
