/*
 *
 * WebSocket class use for communication between client and server
 *
 * @author  Jesus R. Martinez (jesus@metacell.us)
 */

define(function (require) {

  var MessageReassembler = require('./MessageReassembler');

  return function (GEPPETTO) {

    var messageHandlers = [];
    var clientID = null;
    var nextID = 0;
    var connectionInterval = 300;
    var pako = require("pako");
    var FileSaver = require('file-saver');

    var callbackHandler = {};

    // Create an instance of the message reassembler
    var messageReassembler = new MessageReassembler();

    /*
     * Some WebSocket stacks negotiate permessage-deflate and then fail to
     * inflate what the server sends - Apple's NSURLSession implementation,
     * used by Safari and by every browser on iOS, is the known case. The
     * symptom is a frame that arrives and decompresses to truncated JSON,
     * followed by the connection dropping.
     *
     * Browsers offer permessage-deflate unconditionally and expose no API to
     * decline it, so the only lever is to ask the server not to accept the
     * offer. Reconnecting with nodeflate=1 makes the server strip the
     * extension for that handshake.
     *
     * The decision is evidence-based rather than a user-agent guess: we act
     * only when a frame actually failed AND socket.extensions confirms
     * compression was negotiated. The verdict is remembered so a returning
     * visitor skips the broken path, and expires so that a browser which
     * later gets fixed earns compression back.
     */
    /*
     * How long a connection must stay open before it counts as stable and the
     * reconnection budget is handed back. Comfortably longer than the failure
     * it guards against, where the socket opens and dies within a second or
     * two, and shorter than the time the budget takes to exhaust.
     */
    var STABLE_CONNECTION_MS = 30 * 1000;
    var stableConnectionTimer = null;

    function cancelStableConnectionTimer () {
      if (stableConnectionTimer !== null) {
        clearTimeout(stableConnectionTimer);
        stableConnectionTimer = null;
      }
    }

    /*
     * Reconnection is budgeted in wall-clock time rather than attempts, and
     * the retry interval backs off exponentially with jitter. An attempt
     * count at a fixed interval measured the budget in seconds (10 x 5 s),
     * which a closed laptop lid or a phone put in a pocket exhausted every
     * time, and every exhaustion ended in a page reload. A budget in minutes
     * survives those, while the backoff keeps a dead backend from being
     * hammered. The clock starts at the first drop and is reset by a
     * connection that stays open for STABLE_CONNECTION_MS.
     */
    var RECONNECT_BUDGET_MS = 5 * 60 * 1000;
    var RECONNECT_MIN_DELAY_MS = 1000;
    var RECONNECT_MAX_DELAY_MS = 30 * 1000;
    var reconnectTimer = null;
    var reconnectStartedAt = null;

    /*
     * Backbone's trigger runs listeners synchronously and lets their
     * exceptions escape to the caller. A connection event is fired from the
     * middle of the recovery sequence - before the next retry is scheduled,
     * or before the queue is replayed - so an application listener that
     * throws would otherwise stop the recovery it was only meant to observe.
     * Report the listener's failure and carry on.
     */
    function safeTrigger (event, payload) {
      try {
        GEPPETTO.trigger(event, payload);
      } catch (err) {
        console.error("WebSocket - a listener for " + event + " threw: " + (err && err.message ? err.message : err));
      }
    }

    function cancelReconnectTimer () {
      if (reconnectTimer !== null) {
        clearTimeout(reconnectTimer);
        reconnectTimer = null;
      }
    }

    function reconnectDelayMs (attempt) {
      var base = Math.min(RECONNECT_MAX_DELAY_MS, RECONNECT_MIN_DELAY_MS * Math.pow(2, Math.max(0, attempt - 1)));
      // full jitter: spread simultaneous reconnects from many tabs/users
      return Math.floor(base / 2 + Math.random() * (base / 2));
    }

    /*
     * A laptop waking or a network coming back is the moment a retry is
     * most likely to succeed, so skip the remaining backoff and try now.
     */
    function retryNowIfReconnecting () {
      if (GEPPETTO.MessageSocket.socketStatus === GEPPETTO.Resources.SocketStatus.RECONNECTING
        && reconnectTimer !== null) {
        cancelReconnectTimer();
        console.log("%c WebSocket Status - network/visibility changed, reconnecting now ", 'background: #444; color: #bada55');
        GEPPETTO.MessageSocket.connect(GEPPETTO.MessageSocket.host);
      }
    }
    if (typeof window !== 'undefined' && window.addEventListener) {
      window.addEventListener('online', retryNowIfReconnecting);
      document.addEventListener('visibilitychange', function () {
        if (!document.hidden) {
          retryNowIfReconnecting();
        }
      });
    }

    /*
     * Commands issued while the socket is down are queued and replayed once
     * the session is back (resumed on the old server, or re-established on a
     * new one). Dropping them - as send() used to - left half-loaded terms
     * with the spinner stopped even when the reconnect itself succeeded.
     * Queue entries keep their requestID so callers' callbacks still fire.
     */
    var PENDING_QUEUE_LIMIT = 100;
    var pendingQueue = [];

    // How long a session re-establish may take before it counts as failed
    var RESYNC_TIMEOUT_MS = 60 * 1000;
    var resyncTimer = null;

    function cancelResyncTimer () {
      if (resyncTimer !== null) {
        clearTimeout(resyncTimer);
        resyncTimer = null;
      }
    }

    /*
     * Requests sent and not yet answered on the current socket. When the
     * socket dies their replies die with it (the server wrote them to a
     * connection that no longer exists), so on an abnormal close they are
     * re-queued for replay if they are safe to repeat, and failed otherwise.
     * Everything VFB sends is a read and safe; commands with side effects
     * (running an experiment, persisting a project) are not replayed.
     */
    var REPLAYABLE_COMMANDS = {
      fetch_variable: true,
      fetch: true,
      resolve_import_type: true,
      resolve_import_value: true,
      run_query: true,
      run_query_count: true,
      geppetto_version: true,
      get_model_tree: true,
      get_simulation_tree: true
    };
    var inFlight = {};

    function trackInFlight (requestID, command, template) {
      inFlight[requestID] = { command: command, template: template };
    }

    function requeueInFlight () {
      var lost = inFlight;
      inFlight = {};
      var replayed = 0;
      var failed = 0;
      for (var id in lost) {
        if (REPLAYABLE_COMMANDS[lost[id].command] === true) {
          queuePending(id, lost[id].template);
          replayed++;
        } else {
          delete callbackHandler[id];
          GEPPETTO.trigger('geppetto:request_failed', id);
          failed++;
        }
      }
      if (failed > 0) {
        /*
         * console.error rather than log: an unrepeatable request died with
         * the socket and its caller will never get an answer. The embedding
         * application routes console.error to its analytics, so these are
         * visible after the fact rather than only in the user's own console.
         */
        console.error("WebSocket - " + failed + " in-flight request(s) lost on disconnect (not safe to replay), "
          + replayed + " queued for replay");
      } else if (replayed > 0) {
        console.log("WebSocket - " + replayed + " in-flight request(s) queued for replay");
      }
    }

    function queuePending (requestID, template) {
      if (pendingQueue.length >= PENDING_QUEUE_LIMIT) {
        var dropped = pendingQueue.shift();
        delete callbackHandler[dropped.requestID];
        GEPPETTO.trigger('geppetto:request_failed', dropped.requestID);
        console.error("WebSocket - queue full at " + PENDING_QUEUE_LIMIT
          + " commands, dropping the oldest (requestID " + dropped.requestID + ")");
      }
      pendingQueue.push({ requestID: requestID, template: template });
    }

    function failPending (reason) {
      var failed = pendingQueue;
      pendingQueue = [];
      for (var i = 0; i < failed.length; i++) {
        delete callbackHandler[failed[i].requestID];
        GEPPETTO.trigger('geppetto:request_failed', failed[i].requestID);
      }
      if (failed.length > 0) {
        console.error("WebSocket - dropped " + failed.length + " queued command(s): " + reason);
      }
    }

    var NO_DEFLATE_PARAM = "nodeflate";
    var NO_DEFLATE_KEY = "geppetto.ws.nodeflate";
    var NO_DEFLATE_TTL_MS = 30 * 24 * 60 * 60 * 1000;
    // Used when Storage is unavailable (Safari private browsing throws on access)
    var noDeflateMemoryFlag = false;

    function deflateKnownBroken () {
      if (noDeflateMemoryFlag) {
        return true;
      }
      try {
        var stored = window.localStorage.getItem(NO_DEFLATE_KEY);
        if (stored === null) {
          return false;
        }
        if (Date.now() - Number(stored) > NO_DEFLATE_TTL_MS) {
          window.localStorage.removeItem(NO_DEFLATE_KEY);
          return false;
        }
        return true;
      } catch (err) {
        return false;
      }
    }

    function rememberDeflateBroken () {
      noDeflateMemoryFlag = true;
      try {
        window.localStorage.setItem(NO_DEFLATE_KEY, String(Date.now()));
      } catch (err) {
        // Storage unavailable - the in-memory flag still covers this session
      }
    }

    function withoutDeflate (host) {
      if (host == null || host.indexOf(NO_DEFLATE_PARAM + "=1") > -1) {
        return host;
      }
      return host + (host.indexOf("?") > -1 ? "&" : "?") + NO_DEFLATE_PARAM + "=1";
    }

    function deflateNegotiated () {
      var socket = GEPPETTO.MessageSocket.socket;
      return socket != null
        && typeof socket.extensions === "string"
        && socket.extensions.indexOf("permessage-deflate") > -1;
    }

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
      // wall-clock budget for a reconnection episode; see RECONNECT_BUDGET_MS
      reconnectBudgetMs: RECONNECT_BUDGET_MS,
      socketStatus: GEPPETTO.Resources.SocketStatus.CLOSE,

      /*
       * Set while a reconnect is waiting on the server's verdict (resume or
       * re-establish). Commands sent in this window are queued, not sent, so
       * they cannot race ahead of the session they need.
       */
      awaitingSession: false,

      connect: function (host) {
        var that = this;
        /*
         * A browser previously seen to mishandle permessage-deflate asks the
         * server to decline it, so the broken path is skipped on this and
         * every later visit rather than being rediscovered each time.
         */
        if (deflateKnownBroken()) {
          host = withoutDeflate(host);
        }
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
          cancelReconnectTimer();
          GEPPETTO.MessageSocket.socketStatus = GEPPETTO.Resources.SocketStatus.OPEN;
          if (messageHandlers.length > 0) {
            /*
             * Ask the server to resume the session it held for our previous
             * connection. It answers by resuming silently (the fast path:
             * same JVM, within its retention window) or with
             * reconnection_error, which GlobalHandler turns into a session
             * re-establish on this same socket (see resyncSession). Either
             * way the queued commands wait for sessionReady().
             */
            GEPPETTO.MessageSocket.awaitingSession = true;
            GEPPETTO.MessageSocket.resyncing = false;
            var parameters = {};
            parameters["connectionID"] = GEPPETTO.MessageSocket.lostConnectionId;
            parameters["projectId"] = GEPPETTO.MessageSocket.projectId;
            GEPPETTO.MessageSocket.send("reconnect", parameters);
            /*
             * The server says nothing on a successful resume, only on a
             * failed one. Messages on a socket are handled in order, so a
             * cheap request sent right behind the resume is answered only
             * after the resume was processed: if its reply arrives and no
             * reconnection_error has, the old session is back.
             */
            GEPPETTO.MessageSocket.send("geppetto_version", null, function () {
              if (GEPPETTO.MessageSocket.awaitingSession && !GEPPETTO.MessageSocket.resyncing) {
                GEPPETTO.MessageSocket.sessionReady(true);
              }
            });
          } else {
            messageHandlers.push(GEPPETTO.MessageHandler);
            messageHandlers.push(GEPPETTO.GlobalHandler);
          }
          GEPPETTO.MessageSocket.lostConnectionId = undefined;
          /*
           * Hand the reconnection budget back only once this connection has
           * proven it can stay open. Resetting here on open instead - as this
           * did - makes the budget unreachable when a connection opens and
           * dies repeatedly: every open zeroes the count, so it never reaches
           * the limit, the give-up branch never runs, and the client retries
           * in silence for as long as the page is left open. A connection that
           * survives to the timer below is genuinely healthy and has earned a
           * full budget for whenever it eventually drops.
           */
          cancelStableConnectionTimer();
          stableConnectionTimer = setTimeout(function () {
            stableConnectionTimer = null;
            if (GEPPETTO.MessageSocket.socketStatus === GEPPETTO.Resources.SocketStatus.OPEN) {
              GEPPETTO.MessageSocket.attempts = 0;
              reconnectStartedAt = null;
            }
          }, STABLE_CONNECTION_MS);
          console.log("%c WebSocket Status - Opened ", 'background: #444; color: #bada55')
        };

        GEPPETTO.MessageSocket.socket.onclose = function (e) {
          // This connection did not last; it must not hand the budget back
          cancelStableConnectionTimer();
          GEPPETTO.MessageSocket.awaitingSession = false;
          switch (e.code) {
          case 1000:
            // Clean close, ours or the server's: nothing to recover
            GEPPETTO.MessageSocket.socketStatus = GEPPETTO.Resources.SocketStatus.CLOSE;
            GEPPETTO.CommandController.log(GEPPETTO.Resources.WEBSOCKET_CLOSED, true);
            break;
          default:
            /*
             * Every other close - 1002 protocol error included, which used to
             * reload the page outright - is treated as a drop to recover from.
             * The attempt is counted once, in reconnect(); counting here as
             * well halved the budget.
             */
            if (GEPPETTO.MessageSocket.lostConnectionId === undefined) {
              GEPPETTO.MessageSocket.lostConnectionId = GEPPETTO.MessageSocket.getClientID();
            }
            requeueInFlight();
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
              GEPPETTO.MessageSocket.attempts++;
              break;
            case undefined:
              console.log("%c WebSocket Status - Open connection error ", 'background: #000; color: red');
              GEPPETTO.CommandController.log(GEPPETTO.Resources.WEBSOCKET_RECONNECTION, true);
              GEPPETTO.MessageSocket.attempts++;
              break;
            default:
              console.log("%c WebSocket Status - Closed ", 'background: #000; color: red');
              GEPPETTO.MessageSocket.socketStatus = GEPPETTO.Resources.SocketStatus.CLOSE;
              GEPPETTO.ModalFactory.infoDialog(GEPPETTO.Resources.WEBSOCKET_CONNECTION_ERROR, message);
              GEPPETTO.MessageSocket.attempts++;
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
        if (reconnectTimer !== null) {
          /*
           * A retry is already scheduled; onclose from the dying socket and a
           * caller both asking is normal, one timer is enough.
           */
          return;
        }
        if (reconnectStartedAt === null) {
          reconnectStartedAt = Date.now();
        }
        var elapsed = Date.now() - reconnectStartedAt;
        if (elapsed < GEPPETTO.MessageSocket.reconnectBudgetMs) {
          GEPPETTO.MessageSocket.attempts++;
          GEPPETTO.MessageSocket.socketStatus = GEPPETTO.Resources.SocketStatus.RECONNECTING;
          var delay = reconnectDelayMs(GEPPETTO.MessageSocket.attempts);
          console.log("WebSocket Status - attempt " + GEPPETTO.MessageSocket.attempts + ", retry in " + delay + "ms", e);
          safeTrigger(GEPPETTO.Events.Websocket_reconnecting, {
            attempt: GEPPETTO.MessageSocket.attempts,
            delayMs: delay,
            elapsedMs: elapsed
          });
          reconnectTimer = setTimeout(function () {
            reconnectTimer = null;
            console.log("%c WebSocket Status - reconnecting... ", 'background: #444; color: #bada55');
            GEPPETTO.MessageSocket.connect(that.host);
          }, delay);
        } else {
          /*
           * Budget exhausted: the backend has been unreachable for minutes.
           * No dialog and no reload from here - the application decides what
           * to show (VFB puts up a persistent notice with a reload button).
           * Queued commands are failed so their loaders can drain.
           */
          GEPPETTO.MessageSocket.socketStatus = GEPPETTO.Resources.SocketStatus.CLOSE;
          GEPPETTO.CommandController.log(GEPPETTO.Resources.WEBSOCKET_CLOSED, true);
          console.error("WebSocket - giving up after " + Math.round(elapsed / 1000) + "s and "
            + GEPPETTO.MessageSocket.attempts + " attempt(s); last close: "
            + (e && e.code ? e.code + " " + (e.reason || "") : "unknown"));
          failPending('reconnection budget exhausted');
          reconnectStartedAt = null;
          safeTrigger(GEPPETTO.Events.Websocket_disconnected, {
            reason: 'budget-exhausted',
            attempts: GEPPETTO.MessageSocket.attempts,
            elapsedMs: elapsed,
            closeCode: e && e.code
          });
        }
      },

      /**
       * Called once the server session is usable again: either the old one
       * was resumed (resumed=true) or a new one was established in place
       * (resumed=false, see resyncSession). Replays queued commands in order.
       */
      sessionReady: function (resumed) {
        cancelResyncTimer();
        GEPPETTO.MessageSocket.awaitingSession = false;
        GEPPETTO.MessageSocket.resyncing = false;
        var queued = pendingQueue;
        pendingQueue = [];
        for (var i = 0; i < queued.length; i++) {
          this.waitForConnection(queued[i].template, connectionInterval);
        }
        /*
         * How long the user was actually without a working session, and how
         * many retries it took. Reported by the application so a recovery
         * that technically worked but took a minute is distinguishable from
         * one that took a second.
         */
        var downtimeMs = reconnectStartedAt === null ? 0 : Date.now() - reconnectStartedAt;
        var attempts = GEPPETTO.MessageSocket.attempts;
        reconnectStartedAt = null;
        console.log("%c WebSocket Status - session " + (resumed ? "resumed" : "re-established")
          + " after " + downtimeMs + "ms and " + attempts + " attempt(s), replayed " + queued.length + " command(s) ",
        'background: #444; color: #bada55');
        safeTrigger(GEPPETTO.Events.Websocket_reconnected, {
          resumed: resumed,
          replayed: queued.length,
          downtimeMs: downtimeMs,
          attempts: attempts
        });
      },

      /**
       * The server could not resume our session (a redeploy, an OOM restart,
       * or the other replica behind the load balancer). The socket itself is
       * open and carries a fresh, empty manager, so instead of reloading the
       * page - throwing away colours, visibility, camera and layout the
       * client still holds - we load the project again on this server.
       *
       * The client model is NOT rebuilt: MessageHandler sees resyncing and
       * only adopts the new project/experiment ids from project_loaded,
       * ignoring geppetto_model_loaded (the same vfb.json we already have).
       * Anything later fetched that the client already holds is a no-op in
       * ModelFactory.mergeModel. Nothing server-side needs to survive.
       */
      resyncSession: function () {
        if (GEPPETTO.MessageSocket.projectURL == null) {
          // Never loaded a project from a URL: nothing we can re-establish
          failPending('no project URL to re-establish the session with');
          safeTrigger(GEPPETTO.Events.Websocket_disconnected, { reason: 'resync-impossible' });
          return;
        }
        GEPPETTO.MessageSocket.awaitingSession = true;
        GEPPETTO.MessageSocket.resyncing = true;
        safeTrigger(GEPPETTO.Events.Websocket_session_lost);
        console.log("%c WebSocket Status - session lost on server, re-establishing on this connection ", 'background: #444; color: #bada55');
        // Bypass the queue: this is the command the queue is waiting on
        var requestID = this.createRequestID();
        this.waitForConnection(messageTemplate(requestID, "load_project_from_url", GEPPETTO.MessageSocket.projectURL), connectionInterval);
        // A server that never answers is treated like one that refused
        cancelResyncTimer();
        resyncTimer = setTimeout(function () {
          resyncTimer = null;
          if (GEPPETTO.MessageSocket.resyncing) {
            GEPPETTO.MessageSocket.resyncFailed('no reply to load_project_from_url within ' + RESYNC_TIMEOUT_MS + 'ms');
          }
        }, RESYNC_TIMEOUT_MS);
      },

      /**
       * Re-establishing the session on the new server did not work. Fail
       * the queue and let the application decide (VFB reloads from the URL,
       * which is what every drop used to do unconditionally).
       */
      resyncFailed: function (reason) {
        cancelResyncTimer();
        GEPPETTO.MessageSocket.awaitingSession = false;
        GEPPETTO.MessageSocket.resyncing = false;
        failPending('session re-establish failed: ' + reason);
        console.error("WebSocket - session re-establish failed: " + reason);
        safeTrigger(GEPPETTO.Events.Websocket_disconnected, { reason: 'resync-failed', detail: reason });
      },

      /**
       * Sends messages to the server
       */
      send: function (command, parameter, callback) {
        var requestID = this.createRequestID();

        // add callback with request id if any
        if (callback != undefined) {
          callbackHandler[requestID] = callback;
        }

        if (command === "load_project_from_url") {
          // Remembered so a lost server session can be re-established in place
          GEPPETTO.MessageSocket.projectURL = parameter;
        }

        var template = messageTemplate(requestID, command, parameter);
        var handshake = command === "reconnect" || command === "geppetto_version";
        var sessionBusy = GEPPETTO.MessageSocket.socketStatus === GEPPETTO.Resources.SocketStatus.RECONNECTING
          || (GEPPETTO.MessageSocket.awaitingSession && !handshake);
        if (sessionBusy) {
          if (command === "reconnect") {
            // A resume only makes sense on a freshly opened socket; onopen sends its own
            delete callbackHandler[requestID];
            return requestID;
          }
          // Hold it until the session is back, then replay in order
          queuePending(requestID, template);
          return requestID;
        }

        // if there's a script running let it know the requestID it's using to send one of it's commands
        if (GEPPETTO.ScriptRunner.isScriptRunning()) {
          GEPPETTO.ScriptRunner.waitingForServerResponse(requestID);
        }

        this.waitForConnection(template, connectionInterval);

        return requestID;
      },

      waitForConnection: function (messageTemplate, interval) {
        if (this.isReady() === 1) {
          var sent = JSON.parse(messageTemplate);
          trackInFlight(sent.requestID, sent.type, messageTemplate);
          GEPPETTO.MessageSocket.socket.send(messageTemplate);
        } else if (this.isReady() > 1){
          /*
           * Closing (2) or closed (3): onclose is (or is about to be) driving
           * a reconnect, so hold the message for replay rather than dropping
           * it and announcing a disconnect the reconnect logic already knows about.
           */
          var m = JSON.parse(messageTemplate);
          if (m.type === "reconnect") {
            delete callbackHandler[m.requestID];
            return;
          }
          queuePending(m.requestID, messageTemplate);
        } else {
          // must be in connecting (0) state
          var that = this;
          setTimeout(function () {
            that.waitForConnection(messageTemplate, interval);
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
        safeTrigger(GEPPETTO.Events.Websocket_disconnected);

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
       * Sets the id of the client
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
      // Process potential paginated message
      var processedMessage = messageReassembler.processMessage(messageData);
      
      // If null, this is a paginated message still being assembled
      if (processedMessage === null) {
        return; // Wait for more chunks
      }
      
      /*
       * If processedMessage is a string, parse it (original message).
       *
       * A truncated payload (seen from Safari 26 on a failing connection,
       * where the frame decompresses but the JSON inside is cut mid-string)
       * throws here. MessageReassembler.processMessage already swallowed the
       * first parse failure and handed back the raw string, so without this
       * guard the throw escapes onmessage uncaught, and parseAndNotify never
       * reaches the handler/callback loop below - the app then waits forever
       * for a reply that already arrived broken, with nothing shown to the
       * user. Report it: the pending request cannot be recovered.
       */
      var parsedServerMessage;
      try {
        parsedServerMessage = (typeof processedMessage === 'string')
          ? JSON.parse(processedMessage)
          : processedMessage;
      } catch (err) {
        var truncatedLength = (typeof processedMessage === 'string') ? processedMessage.length : -1;
        handleCorruptFrame("truncated-message: " + err, truncatedLength + " characters");
        return;
      }

      // notify all handlers
      for (var i = 0, len = messageHandlers.length; i < len; i++) {
        var handler = messageHandlers[i];
        if (handler != null || handler != undefined) {
          handler.onMessage(parsedServerMessage);
        }
      }

      // run callback if any
      if (parsedServerMessage.requestID != undefined){
        // Answered: no longer in flight (error replies count as answered too)
        delete inFlight[parsedServerMessage.requestID];
        if (callbackHandler[parsedServerMessage.requestID] != undefined) {
          /*
           * If the server reports an error for this request, do NOT invoke the
           * stored callback -- it is a success continuation and would run on
           * missing/garbage data. Drop it and signal the failure by requestID
           * so the caller (e.g. VFBMain.fetchVariableThenRun) can retry or
           * drain its loader entry rather than orphaning it forever. Requires
           * the backend to echo the requestID on the error reply; harmless
           * (no-op) until it does.
           */
          var msgType = parsedServerMessage.type;
          var isErrorReply = msgType === "generic_error"
            || msgType === "error_downloading_model"
            || msgType === "error_downloading_results"
            || msgType === "error_loading_project"
            || msgType === "error_loading_simulation"
            || msgType === "reconnection_error";
          if (isErrorReply) {
            delete callbackHandler[parsedServerMessage.requestID];
            GEPPETTO.trigger('geppetto:request_failed', parsedServerMessage.requestID);
          } else {
            callbackHandler[parsedServerMessage.requestID](parsedServerMessage.data);
            delete callbackHandler[parsedServerMessage.requestID];
          }
        }
      }

    }

    /**
     * A frame arrived that could not be read. If compression was negotiated it
     * is the prime suspect: drop it for this browser and reconnect, which
     * recovers silently. Otherwise the transport itself is at fault and there
     * is nothing to fall back to, so tell the user.
     *
     * @param context - short description of what failed, for the report
     * @param size - size of the offending payload, for the log
     */
    function handleCorruptFrame (context, size) {
      console.error("WebSocket - " + context + " (" + size + ")");
      if (deflateNegotiated() && !deflateKnownBroken()) {
        console.error("WebSocket - compression (permessage-deflate) was negotiated on this "
          + "connection; disabling it for this browser and reconnecting uncompressed");
        rememberDeflateBroken();
        GEPPETTO.MessageSocket.attempts = 0;
        GEPPETTO.MessageSocket.socketStatus = GEPPETTO.Resources.SocketStatus.CLOSE;
        /*
         * Carry the current client id across the reconnection. onopen resumes
         * an existing session by sending a reconnect message keyed on
         * lostConnectionId, but that is normally set by the abnormal-close
         * branch of onclose - closing deliberately below takes the clean-close
         * branch instead. Without this the resume is sent with an undefined
         * connection id, which the server cannot match: it logs
         * "other.getUser() returned null" and drops the connection, so the
         * client reconnects again and the pair repeats.
         */
        if (GEPPETTO.MessageSocket.lostConnectionId === undefined) {
          GEPPETTO.MessageSocket.lostConnectionId = GEPPETTO.MessageSocket.getClientID();
        }
        try {
          GEPPETTO.MessageSocket.socket.close();
        } catch (err) {
          // Already closing or closed - reconnecting below is what matters
        }
        GEPPETTO.MessageSocket.connect(withoutDeflate(GEPPETTO.MessageSocket.host));
        return;
      }
      if (typeof window.vfbReportWebsocketFailure === 'function') {
        window.vfbReportWebsocketFailure(context);
      }
    }

    function processBinaryMessage (message) {

      var messageBytes = new Uint8Array(message);

      /*
       * A malformed binary frame - empty, or one that fails to decompress,
       * or one whose declared file name is truncated/garbage - is a
       * transport failure (seen from Safari 26 on a flaky connection), not
       * a real server message. It typically means a reply the app was
       * actually waiting on (e.g. the reconnect handshake) was corrupted in
       * transit, so from the user's point of view the app is now stuck, not
       * just delayed. Without these guards it falls through to the file
       * branch below and silently hands the user an empty file named
       * "download" with no indication anything went wrong.
       *
       * Report it immediately as a WebSocket failure (dialog + GA) rather
       * than only logging it: the transport can independently report
       * "Opened" right around the same time, which reflects only the raw
       * socket state and is not proof the app-level session recovered.
       */
      var reportCorruptFrame = function (reason) {
        handleCorruptFrame("corrupt-binary-frame: " + reason, messageBytes.length);
      };

      if (messageBytes.length === 0) {
        reportCorruptFrame('received an empty binary message');
        return;
      }

      /*
       * if it's a binary message and first byte it's zero then assume it's a compressed json string
       * otherwise is a file and a 'save as' dialog is opened
       */
      if (messageBytes[0] == 0) {
        var message;
        try {
          message = pako.ungzip(messageBytes.subarray(1), { to: "string" });
        } catch (err) {
          reportCorruptFrame('failed to decompress a binary message: ' + err);
          return;
        }
        parseAndNotify(message);
      } else {
        var fileNameLength = messageBytes[1];
        var fileName = String.fromCharCode.apply(null, messageBytes.subarray(2, 2 + fileNameLength));
        /*
         * Only save when the declared file name is intact and printable;
         * anything else is a corrupted or truncated frame, not a download
         * the server initiated.
         */
        if (!fileNameLength || fileName.length !== fileNameLength || !/^[\x20-\x7e]+$/.test(fileName)) {
          reportCorruptFrame('malformed binary message, not saving it as a file');
          return;
        }
        var blob = new Blob([message]);
        FileSaver.saveAs(blob.slice(2 + fileNameLength), fileName);
      }
    }
  }
});
