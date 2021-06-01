/**
 *
 * Events
 *
 * Different types of events that exist
 *
 * @enum
 */

export default function (GEPPETTO) {
  /**
   * @class GEPPETTO.Events
   */
  GEPPETTO.Events = {
    Select: "experiment:selection_changed",
    Visibility_changed: "experiment:visibility_changed",
    Focus_changed: "experiment:focus_changed",
    Experiment_over: "experiment:over",
    Project_loading: "project:loading",
    Project_loaded: "project:loaded",
    Project_downloaded: "project:downloaded",
    Model_loaded: "model:loaded",
    Experiment_loaded: "experiment:loaded",
    ModelTree_populated: "experiment:modeltreepopulated",
    SimulationTree_populated: "experiment:simulationtreepopulated",
    Do_experiment_play: "experiment:doPlay",
    Experiment_play: "experiment:play",
    Experiment_status_check: "experiment:status_check",
    Experiment_pause: "experiment:pause",
    Experiment_resume: "experiment:resume",
    Experiment_running: "experiment:running",
    Experiment_stop: "experiment:stop",
    Experiment_completed: "experiment:completed",
    Experiment_failed: "experiment:failed",
    Experiment_update: "experiment:update",
    Experiment_updated: "experiment:updated",
    Experiment_renamed: "experiment:renamed",
    Experiment_deleted: "experiment_deleted",
    Experiment_active: "experiment_active",
    Experiment_created: "experiment:created",
    Project_persisted: "project:persisted",
    Spotlight_closed: "spotlight:closed",
    Spotlight_loaded: "spotlight:loaded",
    Instance_deleted: "instance:deleted",
    Instances_created: "instances:created",
    Instance_added: "instance:added",
    Show_Tutorial: "show_tutorial",
    Hide_Tutorial: "hide_tutorial",
    Show_spinner: "spinner:show",
    Hide_spinner: "spinner:hide",
    Color_set: "color:set",
    Canvas_initialised: "canvas:initialised",
    Project_made_public: "project_made_public",
    Control_panel_open: "control_panel:open",
    Control_panel_close: "control_panel:close",
    Lit_entities_changed: "lit_entities_changed",
    Component_destroyed: "component_destroyed",
    Experiment_properties_saved : "experiment_properties_saved",
    Project_properties_saved : "project_properties_saved",
    Parameters_set : "parameters_set",
    Command_log : "command:log",
    Command_log_debug : "command:log_debug",
    Command_log_run : "command:log_run",
    Command_clear : "command:clear",
    Command_toggle_implicit : "command:toggle_implicit",
    Receive_Python_Message: "receive_python_message",
    Websocket_disconnected : "websocket_disconnected",
    Error_while_exec_python_command: "error_while_exec_python_command",
    Update_camera : "update_camera",

    listen: function () {
    }
  };
}
