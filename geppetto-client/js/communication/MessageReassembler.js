/**
 * Handles reassembly of paginated messages sent from the server
 */
function MessageReassembler() {
  // Storage for message fragments, keyed by messageId
  var messageBuffer = {};
  
  // Default cleanup timeout (5 minutes)
  var CLEANUP_TIMEOUT = 5 * 60 * 1000;
  
  /**
   * Process an incoming message and check if it's paginated
   * 
   * @param {String} messageData - Raw message data from WebSocket
   * @returns {Object|null} - Processed message or null if still assembling chunks
   */
  function processMessage(messageData) {
    try {
      var parsedMessage = JSON.parse(messageData);
      
      // Check if this is a paginated message
      if (parsedMessage._pagination) {
        console.debug("Received paginated message: page " + 
          parsedMessage._pagination.page + "/" + parsedMessage._pagination.totalPages);
        
        var pagination = parsedMessage._pagination;
        var messageId = pagination.messageId;
        var content = parsedMessage.content;
        
        // Initialize buffer entry if it doesn't exist
        if (!messageBuffer[messageId]) {
          messageBuffer[messageId] = {
            chunks: {},
            totalPages: pagination.totalPages,
            receivedPages: 0,
            timestamp: Date.now()
          };
        }
        
        // Add this chunk
        messageBuffer[messageId].chunks[pagination.page] = content;
        messageBuffer[messageId].receivedPages++;
        
        // If we've received all chunks, reassemble and process
        if (messageBuffer[messageId].receivedPages === messageBuffer[messageId].totalPages) {
          var completeMessage = reassembleMessage(messageId);
          cleanupMessageBuffer(messageId);
          return completeMessage;
        }
        
        // Still waiting for more chunks
        return null;
      }
      
      // Not a paginated message, return as-is
      return parsedMessage;
      
    } catch (e) {
      /*
       * Returning the raw string here is a fallback for a message that was
       * never JSON. It is NOT a recovery for a truncated payload: the caller
       * parses the returned string again, so a broken payload simply throws
       * a second time, uncaught. Log enough to tell the two cases apart -
       * parseAndNotify guards the re-parse and reports the failure.
       */
      console.error("Error processing message (" + (typeof messageData === 'string' ? messageData.length + " chars" : typeof messageData) + ")", e);
      return messageData;
    }
  }
  
  /**
   * Reassemble a complete message from its chunks
   */
  function reassembleMessage(messageId) {
    var buffer = messageBuffer[messageId];
    var orderedChunks = [];
    
    // Sort chunks by page number
    for (var i = 1; i <= buffer.totalPages; i++) {
      if (buffer.chunks[i]) {
        orderedChunks.push(buffer.chunks[i]);
      }
    }
    
    // If content is JSON objects, parse and combine them
    if (typeof orderedChunks[0] === 'object') {
      return combineJsonChunks(orderedChunks);
    } else {
      // For string content, concatenate
      return orderedChunks.join('');
    }
  }
  
  /**
   * Clean up buffer after message is reassembled
   */
  function cleanupMessageBuffer(messageId) {
    delete messageBuffer[messageId];
  }
  
  /**
   * Combine JSON chunks into a single object
   */
  function combineJsonChunks(jsonChunks) {
    // Simple concatenation for JSON strings
    var jsonStr = "";
    for (var i = 0; i < jsonChunks.length; i++) {
      jsonStr += jsonChunks[i];
    }
    
    try {
      return JSON.parse(jsonStr);
    } catch (e) {
      console.error("Failed to parse reassembled JSON", e);
      return jsonStr;
    }
  }
  
  /**
   * Run periodic cleanup of message buffer
   */
  function startCleanupTask() {
    setInterval(function() {
      var now = Date.now();
      
      Object.keys(messageBuffer).forEach(function(messageId) {
        if (now - messageBuffer[messageId].timestamp > CLEANUP_TIMEOUT) {
          console.warn("Cleaning up stale message fragments for: " + messageId);
          delete messageBuffer[messageId];
        }
      });
    }, 60000); // Run every minute
  }
  
  /**
   * Log reassembly status information
   */
  function logReassemblyStatus() {
    var activeMessages = Object.keys(messageBuffer).length;
    if (activeMessages > 0) {
      console.debug("Message reassembly status: " + activeMessages + " messages being assembled");
      
      Object.keys(messageBuffer).forEach(function(messageId) {
        var buffer = messageBuffer[messageId];
        console.debug("Message " + messageId + ": " + 
                     buffer.receivedPages + "/" + buffer.totalPages + 
                     " pages received");
      });
    }
  }
  
  // Add a periodic status log (uncomment for debugging)
  // setInterval(logReassemblyStatus, 5000);
  
  // Start the cleanup task
  startCleanupTask();
  
  // Return public API
  return {
    processMessage: processMessage
  };
}

// Compatibility with new imports and old require syntax
if (typeof define !== 'undefined') {
  define(['jquery'], function() {
    return MessageReassembler;
  });
}
MessageReassembler.default = MessageReassembler;
module.exports = MessageReassembler;