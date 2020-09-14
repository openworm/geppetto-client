/*
 *
 * WebSocket class use for communication between client and server
 *
 * @author  Jesus R. Martinez (jesus@metacell.us)
 */

define(function (require) {

  return function (GEPPETTO) {

    var messageHandlers = [];
    var clientID = null;
    var nextID = 0;
    var connectionInterval = 300;
    var pako = require("pako");
    var FileSaver = require('file-saver');

    var callbackHandler = {};

    /**
     * Web socket creation and communication
     */
    GEPPETTO.MessageSocket = {
      socket: null,

      // sets protocol to use for connection
      protocol: GEPPETTO_CONFIGURATION.useSsl ? "wss://" : "ws://",

      // flag used to connect using ws protocol if wss failed
      failsafe: false,

      // vars used for reconnection
      attempts: 0,
      host: undefined,
      projectId: undefined,
      lostConnectionId: undefined,
      reconnectionLimit: 10,
      autoReconnectInterval: 5 * 1000,
      socketStatus: GEPPETTO.Resources.SocketStatus.CLOSE,

      connect: function (host) {
        var that = this;
        if (GEPPETTO.MessageSocket.socket !== null) {
          delete GEPPETTO.MessageSocket.socket;
        }
        if ('WebSocket' in window) {
          GEPPETTO.MessageSocket.socket = new WebSocket(host);
          GEPPETTO.MessageSocket.host = host;
          GEPPETTO.MessageSocket.socket.binaryType = "arraybuffer";
        } else if ('MozWebSocket' in window) {
          GEPPETTO.MessageSocket.socket = new MozWebSocket(host);
        } else {
          GEPPETTO.CommandController.log(GEPPETTO.Resources.WEBSOCKET_NOT_SUPPORTED, true);
          return;
        }

        GEPPETTO.MessageSocket.socket.onopen = function (e) {
          GEPPETTO.CommandController.log(GEPPETTO.Resources.WEBSOCKET_OPENED, true);

          /*
           * attach the handlers once socket is opened on the first connection
           * differently handle the reconnection scenario
           */
          if (messageHandlers.length > 0) {
            GEPPETTO.trigger(GEPPETTO.Events.Show_spinner, GEPPETTO.Resources.LOADING_PROJECT);
            var parameters = {};
            parameters["connectionID"] = GEPPETTO.MessageSocket.lostConnectionId;
            parameters["projectId"] = GEPPETTO.MessageSocket.projectId;
            GEPPETTO.MessageSocket.send("reconnect", parameters);
            GEPPETTO.trigger(GEPPETTO.Events.Hide_spinner);
          } else {
            messageHandlers.push(GEPPETTO.MessageHandler);
            messageHandlers.push(GEPPETTO.GlobalHandler);
          }
          GEPPETTO.MessageSocket.lostConnectionId = undefined;

          // Reset the counter for reconnection
          GEPPETTO.MessageSocket.attempts = 0;
          GEPPETTO.MessageSocket.socketStatus = GEPPETTO.Resources.SocketStatus.OPEN;
          console.log("%c WebSocket Status - Opened ", 'background: #444; color: #bada55')
        };

        GEPPETTO.MessageSocket.socket.onclose = function (e) {
          switch (e.code) {
          case 1000:
            GEPPETTO.MessageSocket.socketStatus = GEPPETTO.Resources.SocketStatus.CLOSE;
            GEPPETTO.CommandController.log(GEPPETTO.Resources.WEBSOCKET_CLOSED, true);
            break;
          default:
            if (GEPPETTO.MessageSocket.lostConnectionId === undefined) {
              GEPPETTO.MessageSocket.lostConnectionId = GEPPETTO.MessageSocket.getClientID();
            }
            GEPPETTO.MessageSocket.reconnect(e);
          }
        };

        GEPPETTO.MessageSocket.socket.onmessage = function (msg) {
          var messageData = msg.data;

          if (messageData == "ping") {
            return;
          }

          // if it's a binary (possibly compressed) then determine its type and process it
          if (messageData instanceof ArrayBuffer) {
            processBinaryMessage(messageData);

            // otherwise, for a text message, parse it and notify listeners
          } else {
            // a non compressed message
            parseAndNotify(messageData);
          }

        };

        // Detects problems when connecting to Geppetto server
        GEPPETTO.MessageSocket.socket.onerror = function (e) {
          var message = GEPPETTO.Resources.SERVER_CONNECTION_ERROR;
          /*
           * Attempt to connect using ws first time wss fails,
           * if ws fails too then don't try again and display info error window
           */
          if (GEPPETTO.MessageSocket.failsafe) {
            GEPPETTO.MessageSocket.protocol = "ws://";
            GEPPETTO.MessageSocket.failsafe = true;
            GEPPETTO.MessageSocket.connect(GEPPETTO.MessageSocket.protocol + window.location.host + '/' + GEPPETTO_CONFIGURATION.contextPath + '/GeppettoServlet');
          } else {
            switch (e.code) {
            case 'ECONNREFUSED':
              console.log("%c WebSocket Status - Open connection error ", 'background: #000; color: red');
              GEPPETTO.CommandController.log(GEPPETTO.Resources.WEBSOCKET_CONNECTION_ERROR, true);
              // GEPPETTO.MessageSocket.reconnect(e);
              break;
            case undefined:
              console.log("%c WebSocket Status - Open connection error ", 'background: #000; color: red');
              GEPPETTO.CommandController.log(GEPPETTO.Resources.WEBSOCKET_RECONNECTION, true);
              break;
            default:
              console.log("%c WebSocket Status - Closed ", 'background: #000; color: red');
              GEPPETTO.MessageSocket.socketStatus = GEPPETTO.Resources.SocketStatus.CLOSE;
              GEPPETTO.ModalFactory.infoDialog(GEPPETTO.Resources.WEBSOCKET_CONNECTION_ERROR, message);
              break;
            }
          }
        };
      },

      /**
       * Attempt to reconnect to the backend
       */
      reconnect: function (e) {
        var that = this;
        if (GEPPETTO.MessageSocket.attempts < GEPPETTO.MessageSocket.reconnectionLimit) {
          GEPPETTO.MessageSocket.attempts++;
          GEPPETTO.MessageSocket.socketStatus = GEPPETTO.Resources.SocketStatus.RECONNECTING;
          console.log(`WebSocket Status - retry in ${GEPPETTO.MessageSocket.autoReconnectInterval}ms`, e);
          setTimeout(function () {
            console.log("%c WebSocket Status - reconnecting... ", 'background: #444; color: #bada55');
            GEPPETTO.MessageSocket.connect(that.host);
          }, this.autoReconnectInterval);
        } else {
          GEPPETTO.MessageSocket.socketStatus = GEPPETTO.Resources.SocketStatus.CLOSE;
          GEPPETTO.CommandController.log(GEPPETTO.Resources.WEBSOCKET_CLOSED, true);
          GEPPETTO.ModalFactory.infoDialog(GEPPETTO.Resources.WEBSOCKET_CONNECTION_ERROR, GEPPETTO.Resources.SERVER_CONNECTION_ERROR);
          GEPPETTO.trigger(GEPPETTO.Events.Websocket_disconnected);
        }
      },

      /**
       * Sends messages to the server
       */
      send: function (command, parameter, callback) {
        if (GEPPETTO.MessageSocket.socketStatus === GEPPETTO.Resources.SocketStatus.RECONNECTING && command !== "reconnect") {
          GEPPETTO.ModalFactory.infoDialog(GEPPETTO.Resources.WEBSOCKET_CONNECTION_ERROR,
            "Websocket connection currently not available, wait for reconnection and try again.");
          GEPPETTO.trigger('stop_spin_logo');
          return;
        }
        var requestID = this.createRequestID();

        // if there's a script running let it know the requestID it's using to send one of it's commands
        if (GEPPETTO.ScriptRunner.isScriptRunning()) {
          GEPPETTO.ScriptRunner.waitingForServerResponse(requestID);
        }

        this.waitForConnection(messageTemplate(requestID, command, parameter), connectionInterval);

        // add callback with request id if any
        if (callback != undefined) {
          callbackHandler[requestID] = callback;
        }

        return requestID;
      },

      waitForConnection: function (messageTemplate, interval) {
        if (this.isReady() === 1) {
          GEPPETTO.MessageSocket.socket.send(messageTemplate);
        } else if (this.isReady() > 1){
          // connection is either closing (2) or already closed (3).
          GEPPETTO.trigger(GEPPETTO.Events.Websocket_disconnected);
        } else {
          // must be in connecting (0) state
          var that = this;
          setTimeout(function () {
            that.waitForConnection(messageTemplate);
          }, interval);
        }
      },

      isReady: function () {
        if (GEPPETTO.MessageSocket.socket !== null) {
          return GEPPETTO.MessageSocket.socket.readyState;
        } else {
          return 0;
        }
      },

      close: function () {
        GEPPETTO.MessageSocket.socket.close();
        // dispose of handlers upon closing connection
        messageHandlers = [];
        GEPPETTO.trigger(GEPPETTO.Events.Websocket_disconnected);

      },

      /**
       * Add handler to receive updates from server
       */
      addHandler: function (handler) {
        messageHandlers.push(handler);
      },

      /**
       * Removes a handler from the socket
       */
      removeHandler: function (handler) {
        var index = messageHandlers.indexOf(handler);

        if (index > -1) {
          messageHandlers.splice(index, 1);
        }
      },

      /**
       * Clear handlers
       */
      clearHandlers: function () {
        messageHandlers = [];
      },


      /**
       * Sets the id of the client
       */
      setClientID: function (id) {
        clientID = id;
      },


      /**
       * Gets the id of the client
       */
      getClientID: function () {
        return clientID;
      },

      /**
       * Creates a request id to send with the message to the server
       */
      createRequestID: function () {
        return clientID + "-" + (nextID++);
      }
    };

    /**
     * Template for Geppetto message
     *
     * @param msgtype - message type
     * @param payload - message payload, can be anything
     * @returns JSON stringified object
     */
    function messageTemplate (id, msgtype, payload) {

      if (!(typeof payload == 'string' || payload instanceof String)) {
        payload = JSON.stringify(payload);
      }

      var object = {
        requestID: id,
        type: msgtype,
        data: payload
      };
      return JSON.stringify(object);
    }

    function gzipUncompress (compressedMessage) {
      var messageBytes = new Uint8Array(compressedMessage);
      var message = pako.ungzip(messageBytes, { to: "string" });
      return message;
    }

    function parseAndNotify (messageData) {
      var parsedServerMessage = JSON.parse(messageData);

      // notify all handlers
      for (var i = 0, len = messageHandlers.length; i < len; i++) {
        var handler = messageHandlers[i];
        if (handler != null || handler != undefined) {
          handler.onMessage(parsedServerMessage);
        }
      }

      // run callback if any
      if (parsedServerMessage.requestID != undefined){
        if (callbackHandler[parsedServerMessage.requestID] != undefined) {
          callbackHandler[parsedServerMessage.requestID](parsedServerMessage.data);
          delete callbackHandler[parsedServerMessage.requestID];
        }
      }

    }

    function processBinaryMessage (message) {

      var messageBytes = new Uint8Array(message);

      /*
       * if it's a binary message and first byte it's zero then assume it's a compressed json string
       * otherwise is a file and a 'save as' dialog is opened
       */
      if (messageBytes[0] == 0) {
        var message = pako.ungzip(messageBytes.subarray(1), { to: "string" });
        parseAndNotify(message);
      } else {
        var fileNameLength = messageBytes[1];
        var fileName = String.fromCharCode.apply(null, messageBytes.subarray(2, 2 + fileNameLength));
        var blob = new Blob([message]);
        FileSaver.saveAs(blob.slice(2 + fileNameLength), fileName);
      }
    }
  }
});
