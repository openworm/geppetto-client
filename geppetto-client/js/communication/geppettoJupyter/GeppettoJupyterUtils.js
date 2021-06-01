import StoreManager from '@geppettoengine/geppetto-client/common/StoreManager';

const handle_output = function (data) {
  // data is the object passed to the callback from the kernel execution
  switch (data.msg_type) {
  case 'error':
    GEPPETTO.CommandController.log("ERROR while executing a Python command:");
    GEPPETTO.CommandController.log(data.content.evalue.trim());
    console.error("ERROR while executing a Python command:");
    console.error(data.content.traceback);
    StoreManager.actionsHandler[StoreManager.clientActions.ERROR_WHILE_EXEC_PYTHON_COMMAND](data.content);
    StoreManager.actionsHandler[StoreManager.clientActions.HIDE_SPINNER]();
    break;
  case 'execute_result':
    GEPPETTO.CommandController.log(data.content.data['text/plain'].trim(), true);
    try {
      var response = JSON.parse(data.content.data['text/plain'].replace(/^'(.*)'$/, '$1'));
    } catch (error) {
      var response = data.content.data['text/plain'].replace(/^'(.*)'$/, '$1');
    }
    StoreManager.actionsHandler[StoreManager.clientActions.RECEIVE_PYTHON_MESSAGE]({
      id: data.parent_header.msg_id,
      type: data.msg_type,
      response: response
    });
    break;
  case "display_data":
    // FIXME
    break;
  default:
    GEPPETTO.CommandController.log(data.content.text.trim(), true);
  }
};

const execPythonMessage = function (command, callback = handle_output) {
  GEPPETTO.CommandController.log('Executing Python command: ' + command, true);
  var kernel = IPython.notebook.kernel;
  var messageID = kernel.execute(command, { iopub: { output: callback } }, { silent: false, stop_on_error: true, store_history: true });

  return new Promise((resolve, reject) =>
    StoreManager.eventsCallback[StoreManager.clientActions.RECEIVE_PYTHON_MESSAGE].list.push(action => {
      if (action.data.id == messageID) {
        resolve(action.data.response);
      }
    })
  );
};

const evalPythonMessage = function (command, parameters, parse = true) {
  var parametersString = '';
  if (parameters) {
    if (parameters.length > 0) {
      parametersString = "(" + parameters.map(parameter => "utils.convertToPython('" + JSON.stringify(parameter) + "')").join(",") + ")";
    } else {
      parametersString = '()';
    }
  }

  var finalCommand = command + parametersString;
  if (parse) {
    finalCommand = 'utils.convertToJS(' + finalCommand + ')'
  }
  return execPythonMessage(finalCommand, handle_output);

};

export { execPythonMessage, evalPythonMessage }
