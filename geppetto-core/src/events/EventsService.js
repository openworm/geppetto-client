/**
 * Interface class, no implementation
 */
export default class EventsService {
    
  visibilityChanged (instance) {
    // TODO 
  }

  select (instance, geometryIdentifier, point) {

  }
  
  // listen () {
  //   GEPPETTO.on(this.Select, function () {
  //     // notify widgets that selection has changed in scene
  //     GEPPETTO.WidgetsListener.update(GEPPETTO.Events.Select);

  //     // trigger focus change event
  //     GEPPETTO.trigger(GEPPETTO.Events.Focus_changed);
  //   });

  //   GEPPETTO.on(this.Experiment_active, function () {
  //     GEPPETTO.WidgetsListener.update(GEPPETTO.WidgetsListener.WIDGET_EVENT_TYPE.DELETE);
  //   });

  //   GEPPETTO.on(this.Experiment_loaded, function () {
  //     if (GEPPETTO.UserController.isLoggedIn()) {
  //       GEPPETTO.trigger(GEPPETTO.Events.Hide_spinner);
  //     }
  //   });

  //   GEPPETTO.on(this.Project_loaded, function () {
  //     var projectID = window.Project.getId();
  //     GEPPETTO.Main.startStatusWorker();
  //   });

  //   GEPPETTO.on(this.Experiment_over, function (e) {
  //     var name = e.name;
  //     var id = e.id;

  //     // notify listeners experiment has finished playing
  //     GEPPETTO.WidgetsListener.update(GEPPETTO.Events.Experiment_over);

  //     // check if we are in looping mode
  //     if (GEPPETTO.ExperimentsController.playLoop === true) {
  //       Project.getActiveExperiment().play({ step: 1 });
  //     } else {
  //       GEPPETTO.CommandController.log("Experiment " + name + " with " + id + " is over ");
  //     }
  //   });

  //   GEPPETTO.on(this.Experiment_play, function (parameters) {
  //     GEPPETTO.WidgetsListener.update(GEPPETTO.Events.Experiment_play, parameters);
  //   });

  //   GEPPETTO.on(this.Experiment_stop, function (parameters) {
  //   });

  //   GEPPETTO.on(this.Experiment_update, function (parameters) {
  //     GEPPETTO.WidgetsListener.update(GEPPETTO.Events.Experiment_update, parameters);
  //   });

  //   GEPPETTO.on(this.Lit_entities_changed, function (parameters) {
  //     GEPPETTO.WidgetsListener.update(GEPPETTO.Events.Lit_entities_changed, parameters);
  //   });

  //   GEPPETTO.on(this.Do_experiment_play, function () {
  //     Project.getActiveExperiment().playAll();
  //   });

  //   GEPPETTO.on(this.Component_destroyed, function () {
  //     GEPPETTO.ViewController.anyComponentsDestroyed = true;
  //   });
  // }
}


