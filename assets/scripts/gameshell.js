let SHOW_LOG_MESSAGES = true;

// ===========================================================================
// CLASS DEFINITIONS
// ===========================================================================

/**
 * Game information object sent to the Gameshell with the 'gameReady' event
 *
 * REQUIRED INFORMATION -
 *  name - the name of the game
 *
 *  width - width of the game
 *
 *  height - height of the game
 *
 *  autoScale - is this game allowed to be scaled, or does it have to abide by the width x height
 *
 * Optional Information:
 *  themes - List of theme names available, first theme MUST be 'default'
 *           If not provided, game will be considered not to have any themes
 *
 *  gamesetsAllowed - indicates whether this game allows gamesets to be loaded
 *                    If not provided, the game is considered not to accept any gamesets
 *
 *  allowGameCardNavigation - whether or not the therapist will naviagate through the game cards of the gameset.
 *
 *  minimumGamesetCardsAllowed - minimum number of gameset cards required per gameset
 *                               If not provided and 'gamesetsAllowed' is true, then any number of gameset cards is allowed
 *
 *  isTurnTaking - indicates whether this game has turns or not
 */
class GameInfo {
  constructor({
    name,
    width,
    height,
    autoScale = true,
    isTurnTaking = false,
    allowGameCardNavigation = false
  }) {
    this.name = name;
    this.width = width;
    this.height = height;
    this.autoScale = autoScale;
    this.themes = [];
    this.gamesetsAllowed = false;
    this.minimumGamesetCardsAllowed = 0;
    this.isTurnTaking = isTurnTaking;
    this.allowGameCardNavigation = allowGameCardNavigation;
  }
}

class GameshellGameMessage {
  constructor({ type, data = null }) {
    this.type = type;
    this.data = data;
  }
}

class GameGameshellMessage {
  constructor({ tinyeye, eventType, message, playerIds = null }) {
    this.tinyeye = tinyeye;
    this.eventType = eventType;
    this.message = message;
    this.playerIds = playerIds;
  }
}

// ===========================================================================
// Functions
// ===========================================================================

/**
 * Handles binding an event listener to an element
 * Supports event binding for IE8
 *
 * @param {*} element               element to bind the event listener to
 * @param {string} eventName        event name to be bound
 * @param {function} eventHandler   function to be called when the event is fired
 */
function bindEvent(element, eventName, eventHandler) {
  if (element.addEventListener) {
    element.addEventListener(eventName, eventHandler, false);
  } else if (element.attachEvent) {
    element.attachEvent("on" + eventName, eventHandler);
  }
}

/**
 * Prints a log message to the console
 * @param {message} text to be printed to the console
 * @param {data} data object to be printed as is
 */
function logMessage(text, data = null) {
  if (!SHOW_LOG_MESSAGES) return;

  // prepare timestamp
  let dateOptions = {
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    second: "numeric"
  };
  let timestamp = new Date().toLocaleDateString("en-US", dateOptions);

  console.log("\n" + timestamp + " - GAME LOG MESSAGE ----");
  console.log(text);
  if (data) console.log(data);
}

/**
 * Sends an event to the Gameshell
 *
 * @param {string} eventType type of event
 * @param {object} message message associated with this type of event
 */
function sendToGameshell({ eventType, playerIds = null, message = null }) {
  logMessage("Sending To Gameshell", {
    eventType: eventType,
    playerIds: playerIds,
    message: message
  });
  var gameGameshellMessage = new GameGameshellMessage({
    tinyeye: true, // REQUIRED - important for filtering Gameshell messages
    eventType: eventType,
    message: message,
    playerIds: playerIds
  });

  // send a message to parent window that this document is ready
  if (window && window.parent) {
    window.parent.postMessage(JSON.stringify(gameGameshellMessage), "*");
  }
}

/**
 * Communication with the Gameshell happens through the 'message' event
 * on the Window element. All communication will be received and handled here.
 */
bindEvent(window, "message", function(e) {
  // filter out messages that are not coming from the gameshell
  if (String(e.data).search('"tinyeye":true') < 0) return;

  // message = Object.assign(new GameshellGameMessage, JSON.parse(e.data));
  message = JSON.parse(e.data);
  logMessage("Receiving From Gameshell", e);

  // all event types in the following switch statement are initiated in the Therapist's Gameshell
  // except for the 'gameMessage' which is initiated from any other game instance but passed through via the therapist gameshell
  //
  // To send a message to other game instances, send a 'sentToPlayers' or 'sendToAll' message to the gameshell.
  // The gameshell will in turn forward the message to the intended players

  switch (message.type) {
    case "startGame":
      startGameHook();
      break;

    case "setTheme":
      setThemeHook(message.data);
      break;

    case "setGameset":
      setGamesetHook(message.data);
      break;

    case "setPreviousGamesetCard":
      setGamesetItemHook("previous");
      break;

    case "setNextGamesetCard":
      setGamesetItemHook("next");
      break;

    case "endGame":
      endGameHook();
      break;

    case "gameMessage":
      handleGameMessageHook(message.data);
      break;

    case "setGameshellInfo":
      setGameshellInfoHook(message.data);
      break;

    case "setPlayers":
      setPlayersHook(message.data);
      break;

    case "setCurrentPlayer":
      setCurrentPlayerHook(message.data);
      break;

    case "updatePlayerControls":
      updatePlayerControlsHook(message.data);
      break;
  }
});
