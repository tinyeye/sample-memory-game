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
 *  minimumGamesetCardsAllowed - minimum number of gameset cards required per gameset
 *                               If not provided and 'gamesetsAllowed' is true, then any number of gameset cards is allowed
 */
class GameInfo {
    constructor({ name, width, height, autoScale }) {
        this.name = name;
        this.width = width;
        this.height = height;
        this.autoScale = autoScale;
        this.themes = [];
        this.gamesetsAllowed = false;
        this.minimumGamesetCardsAllowed = 0;
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
        element.attachEvent('on' + eventName, eventHandler);
    }
}

/**
 * Sends an event to the Gameshell
 * 
 * @param {string} type type of event
 * @param {object} data data associated with this type of event
 */
function sendToGameshell({type, data=null}) {
    // send a message to parent window that this document is ready
    if (window && window.parent) {
        window.parent.postMessage(JSON.stringify({
            tinyeye: true,    // REQUIRED - important for filtering Gameshell messages
            type: type,
            data: data
        }), '*');
    }
}

/**
 * Sends a 'gameReady' event to the Gameshell
 * This event should be sent once the game elements are ready to be displayed
 * Also this event introduces the game to the Gameshell (it's name, width, height...etc)
 * 
 * @param {GameInfo} data Game information object
 */
function sendGameReady(data=null) {
    sendToGameshell({type: 'gameReady', data: data});
}

/**
 * Sends a 'gameStarted' event to the Gameshell
 * This event tells the gameshell that the game has started. The Gameshell in turn
 * forwards this event and the data sent with it to other game instances
 * 
 * @param {*} data Data object to be sent to other instances of this game.
 *                 It should help other instances to start the game to the same game state
 *                 as this game
 */
function sendGameStarted(data=null) {
    sendToGameshell({type: 'gameStarted', data: data});
}

/**
 * Sends a 'gameEnded' event to the Gameshell
 * This event tells the Gameshell that the game has ended. The gameshell in turn
 * forwards this event and the data sent with it to other game instances
 * 
 * @param {*} data Data object to be sent to other instances of this game.
 *                 It should help other instances to end the game in a similar manner
 *                 as this game
 */
function sendGameEnded(data=null) {
    sendToGameshell({type: 'gameEnded', data: data});
}

/**
 * Sends a 'gameMessage' to the Gameshell
 * This message indicates that an action or game state change has heppend in this 
 * current game and that it should be applied to other game instances.
 * 
 * @param {*} data Data object to be sent to other instances of this game.
 *                 It should help other instances to update themselves in a manner
 *                 similar to this game instance
 */
function sendGameMessage(data=null) {
    sendToGameshell({type: 'gameMessage', data: data});
}

/**
 * Sends a 'themeChanged' event to the Gameshell
 * 
 * @param {*} data Data object to be sent to other instances of this game.
 *                 It should help other instances to update their theme in a similar manner
 *                 as the current game
 */
function sendThemeChanged(data=null) {
    sendToGameshell({type: 'themeChanged', data: data});
}

/**
 * Sends a 'gamesetChanged' event to the Gameshell.
 * The Gameshell in turn forwards this message and it's data to other game instances
 * 
 * @param {*} data Data object to be sent to other instances of this game
 *                 to help them update their gamesets in a similar manner to this game
 */
function sendGamesetChanged(data=null) {
    sendToGameshell({type: 'gamesetChanged', data: data});
}

/**
 * Sends a 'gamesetItemChanged' event to the Gameshell.
 * The Gameshell in turn forwards this message and it's data to other game instances
 * 
 * @param {*} data Data object to be sent to other games instances
 *                 to help them update the current gameset card in a similar manner
 *                 as this game
 */
function sendGamesetItemChanged(data=null) {
    sendToGameshell({type: 'gamesetItemChanged', data: data});
}

/**
 * Sends back the game state which consists of all
 * information necessary to rebuilt the current game in another instance
 * 
 * @param {*} gameState Game state information
 */
function sendGameState(gameState) {
    sendToGameshell({type: 'gameState', data: gameState});
}

/**
 * Communication with the Gameshell happens through the 'message' event
 * on the Window element. All communication will be received and handled here.
 */
bindEvent(window, 'message', function (e) {
    if (String(e.data).search('"tinyeye":true') >= 0) {
        e = JSON.parse(e.data);
        switch (e.type) {
            case 'startGame':
                startGameHook(e.data, e.eventInitiator);
                break;

            case 'endGame':
                endGameHook(e.data, e.eventInitiator);
                break;

            case 'changeTheme':
                changeThemeHook(e.data, e.eventInitiator);
                break;

            case 'changeGameset':
                    changeGamesetHook(e.data, e.eventInitiator);
                    break;

            case 'changeToPreviousGamesetItem':
                changeGamesetItemHook('previous', e.data, e.eventInitiator);
                break;

            case 'changeToNextGamesetItem':
                changeGamesetItemHook('next', e.data, e.eventInitiator);
                break;

            case 'gameMessage':
                handleGameMessageHook(e.data);
                break;

            case 'getGameState':
                getGameStateHook();
                break;

            case 'setGameState':
                setGameStateHook(e.data);
                break;

            case 'setGameshellInfo':
                setGameshellInfoHook(e.data);
                break;
        }
    }
});