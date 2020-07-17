$(document).ready(initialized);

let singlePlayerMode = true;

// theme can be chosen from this list
let themes = {
  default: {
    backImage: "./assets/js-badge.svg",
    backAlt: "JS Badge",
    cardBackgroundColor: "lightgreen",
    gameBackgroundColor: "darkolivegreen",
    playerNamesColor: "#000000"
  },
  tinyeye: {
    backImage: "./assets/te-butterfly.png",
    backAlt: "TE Butterfly",
    cardBackgroundColor: "#1C7CCC",
    gameBackgroundColor: "#060AB2",
    playerNamesColor: "#FFFFFF"
  }
};

// Gameset images can be updated in this list
// MemoryCard{
//   id: card.id,
//   frontImage: card.file.url,
//   frontAlt: card.label,
//   order: card.order,
//   status: card.status[0].label
// };

let memoryCards = [
  {
    id: 1,
    frontImage: "./assets/aurelia.svg",
    frontAlt: "Aurelia",
    order: 1,
    status: "Confirmed"
  },
  {
    id: 2,
    frontImage: "./assets/vue.svg",
    frontAlt: "Vue",
    order: 2,
    status: "Confirmed"
  },
  {
    id: 3,
    frontImage: "./assets/angular.svg",
    frontAlt: "Angular",
    order: 3,
    status: "Confirmed"
  },
  {
    id: 4,
    frontImage: "./assets/ember.svg",
    frontAlt: "Ember",
    order: 4,
    status: "Confirmed"
  },
  {
    id: 5,
    frontImage: "./assets/backbone.svg",
    frontAlt: "Backbone",
    order: 5,
    status: "Confirmed"
  },
  {
    id: 6,
    frontImage: "./assets/react.svg",
    frontAlt: "React",
    order: 6,
    status: "Confirmed"
  }
];

let currentMemoryCards = memoryCards.slice(0);
let isCustomGameSet = false;
let maxNumberOfUniqueCards = 6;
let cardsOrder = [];

// default variables
let currentThemeName = "default";
let currentTheme = themes["default"];
let lockBoard = false;
let firstCard, secondCard;
let matchesFound = 0;
// 1 is student userType
let userType = 1;

let players = {};
let playerScores = {};
let localPlayerIds = [];
let currentPlayer = null;

let isGameReady = false;
let messageQueue = [];

function initialized() {
  $("#uiStartGame").click(startGameHandler);
  $("#uiRestartGame").click(startGameHandler);

  // preparing an array of card order from 0 to 'total number of cards'
  var totalCards = maxNumberOfUniqueCards * 2;
  for (var i = 1; i <= totalCards; i++) {
    cardsOrder.push(i);
  }

  // prepare theme names available in the game
  let themeNames = [];
  for (var themeName in themes) {
    themeNames.push(themeName);
  }

  // set the default theme
  setTheme();

  var gi = new GameInfo({
    name: "Memory Game",
    width: 680,
    height: 680,
    autoScale: false,
    isTurnTaking: true,
    allowGameCardNavigation: false
  });

  gi.themes = themeNames;
  gi.gamesetsAllowed = true;
  gi.minimumGamesetCardsAllowed = 6;

  sendToGameshell({
    eventType: "gameReady",
    message: gi
  });
}

/**
 * Sets the current theme for the game
 * @param {String} themeName the name of the theme to use
 */
function setTheme(themeName = "default") {
  currentThemeName = themeName;
  currentTheme = themes[themeName];

  // set the board's background color from the theme
  $("body").css("background", currentTheme.gameBackgroundColor);
  $("#uiPlayers").css("color", currentTheme.playerNamesColor);
}

/**
 * Sets the gameset for the game
 * @param {Object} gameset The gameset object {cards: [{id, path, label}], isOrdered, name}
 */
function setGameset(gameset) {
  // if no gameset sent in
  if (gameset == null) {
    isCustomGameSet = false;
    // reset the memory cards into their default ones (clone the original list)
    currentMemoryCards = memoryCards.slice(0);
  } else {
    isCustomGameSet = true;
    // otherwise, clear the current cards list
    currentMemoryCards = [];
    // loop over incoming cards
    for (var card of gameset.cards) {
      // add each card into the current list
      currentMemoryCards.push({
        id: card.id,
        frontImage: card.file.url,
        frontAlt: card.label,
        order: card.order,
        status: card.status[0].label
      });
    }
  }
}

/**
 * @returns True if the game has already started. False otherwise
 */
function isGameStarted() {
  // if the game area is visible, then the game has started
  return $("#uiGameArea").is(":visible");
}

function createCard(id, frontImage, frontAlt = "") {
  // create the div that will hold the card's front and back faces
  var elDiv = $('<div class="memory-card"></div>');
  elDiv.attr("data-id", id);

  // create the front face image
  var elFrontImage = $('<img class="front-face"></img>');
  elFrontImage.css("background", currentTheme.cardBackgroundColor);
  elFrontImage.attr("src", frontImage);
  elFrontImage.attr("alt", frontAlt);

  // create the back face image
  var elBackImage = $('<img class="back-face"></img>');
  elBackImage.css("background", currentTheme.cardBackgroundColor);
  elBackImage.attr("src", currentTheme.backImage);
  elBackImage.attr("alt", currentTheme.backAlt);

  // add the front and back faces to the div
  elDiv.append(elFrontImage);
  elDiv.append(elBackImage);

  // listen for card click
  elDiv.click(cardClickHandler);

  return elDiv;
}

function createGameCards() {
  // prepare game area
  var elGameArea = $("#uiGameArea");
  // remove all cards
  elGameArea.empty();
  // count cards
  var cardCount = 0;
  // each card has to be added twice so we have double the number of cards
  var totalCards = maxNumberOfUniqueCards * 2;
  // create new cards
  for (var card of currentMemoryCards) {
    // each card has to be created twice
    for (var i = 0; i < 2; i++) {
      // create a card element
      var elCard = createCard(card.id, card.frontImage, card.frontAlt);
      // put it at random order
      elCard.css("order", cardsOrder[cardCount]);
      // add it to the game area
      elGameArea.append(elCard);
      // countCard
      cardCount++;
    }

    if (cardCount == totalCards) {
      break;
    }
  }
}

/**
 * Starts/Restarts a new game
 * Advances the game from the intro screen into the game area
 */
function startGame(order = null, startingPlayerId = null) {
  // if we have an incoming card order list
  if (order) {
    // use it to start our game
    cardsOrder = order;
  } else {
    // otherwise, shuffle the built-in card order list
    shuffleList(cardsOrder);
  }
  if (startingPlayerId) {
    currentPlayer = players[startingPlayerId];
  }

  // reset # of found matches
  matchesFound = 0;
  // reset game variables
  lockBoard = false;
  firstCard = secondCard = null;

  // hide game over screen (if visible)
  $("#uiGameOver").hide();
  // hide main menu screen
  $("#uiMainMenu").hide();
  // create/recreate the game cards
  createGameCards();
  // show game area
  $("#uiGameArea").show();
}

/**
 * Ends the game
 * Advances the game from the game area into the Ending screen
 */
function endGame() {
  // hide the game area
  $("#uiGameArea").hide();
  // show the game over area
  $("#uiGameOver").show();
}

/**
 * If the board is not locked, and the clicked card is not the same first card already flipped
 * then flip the card
 *
 * @param {*} card The card to be flipped
 */
function flipCard(card) {
  // if the board is locked, return
  if (lockBoard) return;
  // if no card return
  if (!card) return;
  // if we are clicking the same first flipped card, return
  if (firstCard && card.css("order") === firstCard.css("order")) return;

  // otherwise, flip the card
  card.addClass("flip");

  // if no first card flipped
  if (firstCard == null) {
    // mark this one as first card
    firstCard = card;
  } else {
    // otherwise, this is the second card
    secondCard = card;
    // check for cards match
    checkForMatch();
  }
}

/**
 * check if both cards have the same data-id, then they match
 * if match is found, then keep the cards flipped and disable clicks on them
 * otherwise, unflip the cards and start a new turn
 */
function checkForMatch() {
  var isMatch = firstCard.attr("data-id") === secondCard.attr("data-id");
  isMatch ? disableCards() : unflipCards();
}

/**
 * Disable click events on both cards.
 * If all matches have been found, then end the game
 * Otherwise, start a new turn
 */
function disableCards() {
  firstCard.off("click");
  secondCard.off("click");

  matchesFound++;

  // add a score to current selected player
  if (currentPlayer) {
    playerScores[currentPlayer.personId]++;
  }
  // update the scores
  updateScores();

  if (matchesFound < maxNumberOfUniqueCards) {
    newTurn();
  } else {
    setTimeout(() => {
      endGameHook();
    }, 1000);
  }
}

/**
 * Lock the board, unflip the cards, then start a new turn
 */
function unflipCards() {
  lockBoard = true;

  setTimeout(() => {
    firstCard.removeClass("flip");
    secondCard.removeClass("flip");

    newTurn();
  }, 1500);
}

/**
 * Start a new turn by unlocking the board and clearing first and second cards
 */
function newTurn() {
  lockBoard = false;
  firstCard = secondCard = null;
}

/**
 * Generic function that shuffles any give list
 *
 * @param {*} list A list to be shuffled
 */
function shuffleList(list) {
  var i, j, temp;

  for (i = list.length - 1; i > 0; i--) {
    j = Math.floor(Math.random() * (i + 1));
    temp = list[i];
    list[i] = list[j];
    list[j] = temp;
  }
  return list;
}

/**
 * Updates the players in the game
 */
function updatePlayers() {
  // clear current player names
  var elPlayers = $("#uiPlayers");
  elPlayers.empty();

  // if no players available or if single player mode
  if (singlePlayerMode || !players || players.length == 0)
    // then exit as we will not display names
    return;

  // otherwise, display the names
  var firstTime = true;
  for (var playerId in players) {
    var player = players[playerId];
    
    // if not the first name added
    if (!firstTime) {
      // add a spacer
      elPlayers.append("<label>&nbsp;|&nbsp;</label>");
    }

    // add player name
    elPlayers.append(
      $(
        '<span id="playerspan' +
          playerId +
          '"><label id="player' +
          playerId +
          '">' +
          player.name +
          '<span id="playerscore' +
          playerId +
          '"></span></label></span>'
      )
    );

    updatePlayerControls(player);
    firstTime = false;
  }

  updateCurrentPlayer(currentPlayer);
  updateScores();
}

/**
 * Updates the selected player who is allowed to play the game
 *
 * @param {*} player The current selected player
 */
function updateCurrentPlayer(player) {
  // if we already have a selected player
  if (currentPlayer) {
    // clear it's style
    $("#player" + currentPlayer.personId).css("font-weight", "");
  }

  currentPlayer = player;
  if (currentPlayer) {
    $("#player" + player.personId).css("font-weight", "bold");
  }
}

/**
 * Updates the selected player who is allowed to play the game
 *
 * @param {*} playerIds The current selected player
 */
function setLocalPlayers(playerIds) {
  for (let localPlayerId of playerIds) {
    if (players[localPlayerId]) {
      players[localPlayerId].isLocal = true;
      players[localPlayerId].isOnline = true;
      localPlayerIds.push(localPlayerId);
    }
  }
}

/**
 * Updates the player controls' enabled/disabled flag in the game
 *
 * @param {*} player The player object
 */
function updatePlayerControls(player) {
  if (!player) return;

  if (currentPlayer && currentPlayer.personId === player.personId) {
    currentPlayer.controlsEnabled = player.controlsEnabled;
  }

  $("#playerspan" + player.personId + "> img").remove();
  if (!player.controlsEnabled) {
    $("#playerspan" + player.personId).append(
      $(
        '<img src="./assets/controls-not-allowed.png" alt="no-controls" height="24" width="24">'
      )
    );
  }
}

/**
 * Updates the player scores
 */
function updateScores() {
  for (var playerId in players) {
    if (!(playerId in playerScores)) {
      playerScores[playerId] = 0;
    }

    $("#playerscore" + playerId).empty();
    $("#playerscore" + playerId).append(
      $("<label>&nbsp;(score: " + playerScores[playerId] + ")<label>")
    );
  }
}

/**
 * Sets players to the current game
 * @param {Object} allPlayers List of player(s) currently playing the game
 *    [{id, name, controlsEnabled}]
 *    - controlsEnabled: True is the player is allowed to control the game
 * @returns List of added player ids
 */
function setPlayers(allPlayers) {
  // clear the players lists
  players = {};
  localPlayerIds = [];

  let isSinglePlayerMode = true;
  // grab the user(s) playing this game on the current computer
  for (var player of allPlayers) {
    players[player.personId] = player;
    // these are the local players, grab their ids
    if (player.isLocal) {
      localPlayerIds.push(player.personId);
    }
    // if any of the players is remote, then this is a 2-player mode
    if (!player.isLocal) {
      isSinglePlayerMode = false;
    }
  }

  // update the global singleplayermode
  singlePlayerMode = isSinglePlayerMode;
  // update the UI based on the new mode
  // however for this game, the only updates to the UI will happen 
  // inside the following function call
  updatePlayers();
}

// ===========================================================================
// EVENT HANDLERS
// ===========================================================================

/**
 * Handle clicking the 'Start Game' button inside the game.
 * For this game implementation, the 'Start Game' button only shows for Therapists
 * So we will handle it using the same hook so that other games are started as well
 */
function startGameHandler() {
  startGameHook();
}

function endGameHandler() {
  endGameHook();
}

function cardClickHandler() {
  // Allow the click only if SinglePlayerMode
  // OR if there exists a local player whose controlsEnabled is set to true
  if (!singlePlayerMode &&
    (!currentPlayer.controlsEnabled ||
    !localPlayerIds.includes(currentPlayer.personId))
  ) {
    return;
  }

  console.log('cardClickHandler, isLocal: ', currentPlayer && currentPlayer.isLocal?'true':'false');
  
  // grab the card being flipped
  var elCard = $(this);
  // handle card flipping/unflipping...etc
  flipCard(elCard);
  // send a gameMessage to other game instances
  sendToGameshell({
    eventType: "sendToAll",
    message: {
      type: "flipCard",
      data: elCard.css("order")
    }
  });
}

/**
 * Grabs all information necessary to rebuilt the THIS game's state in another game instance.
 */
function getGameState() {
  // for this game, we need to send
  // - cardsOrder
  // - gameset (stored in 'currentMemoryCards' here)
  // - selected theme
  // - NOT APPLICAPLE HERE - current game set image
  // - information about which cards are flipped, the rest are unflipped
  // - player information (list of players and scores)

  // prepare flipped card information
  var flippedCards = [];
  $(".memory-card").each((index, value) => {
    var elCard = $(value);

    if (elCard.hasClass("flip")) {
      flippedCards.push(elCard.css("order"));
    }
  });

  return {
    cardsOrder: cardsOrder,
    currentMemoryCards: isCustomGameSet ? currentMemoryCards : null,
    themeName: currentThemeName,
    flippedCards: flippedCards,
    isGameStarted: isGameStarted(),
    firstCardOrder: firstCard ? firstCard.css("order") : "",
    secondCardOrder: secondCard ? secondCard.css("order") : "",
    players: Object.values(players),
    playerScores: playerScores,
    currentPlayer: currentPlayer
  };
}

/**
 * Updates the current game's state to match the incoming state
 *
 * @param {*} gameState The game state information
 */
function setGameState(gameState) {
  if (!gameState) return;

  // set the gameset (if any)
  if (gameState.currentMemoryCards) {
    currentMemoryCards = gameState.currentMemoryCards;
  }

  // set theme (if changed)
  setTheme(gameState.themeName);

  // start/restart the game
  if (gameState.isGameStarted) {
    startGame(gameState.cardsOrder, currentPlayer);

    // flip cards to match already running game's state
    $(".memory-card").each((index, value) => {
      var elCard = $(value);

      var cardOrder = elCard.css("order");
      if (gameState.flippedCards.includes(cardOrder)) {
        // flip the card
        elCard.addClass("flip");

        // check if we already have a first/second card then set them up
        if (cardOrder == gameState.firstCardOrder) {
          firstCard = elCard;
        } else if (cardOrder == gameState.secondCardOrder) {
          secondCard = elCard;
        } else {
          // if it is not the first or second opened cards
          // disable the card
          elCard.off("click");
        }
      }
    });

    // if both cards are selected
    if (firstCard && secondCard) {
      // then check for a match
      checkForMatch();
    }
  }

  currentPlayer = gameState.currentPlayer;
  playerScores = gameState.playerScores;
  setPlayers(gameState.players);
}

// ===========================================================================
// HANDLONG GAMESHELL EVENTS
// ===========================================================================

/**
 * Starts the game, then send a message to all other game instances to start their games
 */
function startGameHook() {
  // start/restart the game
  startGame();

  // send message to all other games to start their game
  sendToGameshell({
    eventType: "sendToAll",
    message: {
      type: "startGame",
      data: { cardsOrder: cardsOrder, startingPlayerId: currentPlayer ? currentPlayer.personId : 0 }
    }
  });
}

/**
 * Sets Gameshell information (such as the current user type) in the game
 *
 * @param {*} gameshellInfo Information needed by the game about the Gameshell
 */
function setGameshellInfoHook(gameshellInfo) {
  // handle the userType information
  userType = gameshellInfo.userType;

  // hide the start/restart buttons if this was a player
  // 2 is Therapist UserType
  if (userType != 1 && userType != 3) {
    $("#uiStartGame").show();
    $("#uiRestartGame").show();
  } else {
    $("#uiStartGame").hide();
    $("#uiRestartGame").hide();
  }

  currentPlayer = gameshellInfo.currentPlayer;
  
  // the game is now ready
  isGameReady = true;

  setPlayers(gameshellInfo.players);
  handleMessageQueue();
}

/**
 * Changes the theme of the game based on the theme name passed to it
 *
 * @param {string} theme Name of theme to be applied.
 */
function setThemeHook(theme) {
  // change the theme
  setTheme(theme);

  // since changing the theme will affect the cards
  // check if the game is already started
  if (isGameStarted()) {
    // then restart it again
    startGame();
  }

  // send message to all other games to change their themes
  sendToGameshell({
    eventType: "sendToAll",
    message: {
      type: "setTheme",
      data: { theme: theme, cardsOrder: cardsOrder }
    }
  });
}

/**
 * Changes the gameset for this game.
 *
 * @param {*} data Gameset to use in this game.
 */
function setGamesetHook(data) {
  // update the gameset
  setGameset(data);

  // since changing the gameset will affect the cards
  // check if the game is already started
  if (isGameStarted()) {
    // then restart it again
    startGame();
  }

  // send message to all other games to change their themes
  sendToGameshell({
    eventType: "sendToAll",
    message: {
      type: "setGameset",
      data: { gameset: data, cardsOrder: cardsOrder }
    }
  });
}

/**
 * Changes the current gameset card into a previous or next card.
 *
 * @param {string} direction The direction to change the gameset card. 'Next' to go forward or
 *                           'previous' to go backwards.
 */
function setGamesetItemHook(direction) {
  // this method doesn't apply to this game
  // example implementation
  // grab the card
  //var card = direction == 'next' ? nextCard : previousCard;
  //setGamesetCard(card);
  // once the gameset card is changed, send a message to all other game instances
  //sendToGameshell({
  //  eventType: 'sendToAll',
  //  message: {
  //    type: 'setGamesetItem',
  //    data: {gamesetItem: card}
  //  }
  //});
}

/**
 * Ends the game
 *
 * @param {*} data Data object sent by other game instances. Null if this game (or Gameshell) is initiating the event
 */
function endGameHook() {
  // end the game
  endGame();

  // send message to all other games to start their game
  sendToGameshell({
    eventType: "sendToAll",
    message: {
      type: "endGame"
    }
  });
}

/**
 * Sets the players joined in this game
 *
 * @param {*} playersInfo List of player(s) [{id, name, controlsEnabled}]
 */
function setPlayersHook(allPlayers) {
  // store new player ids
  var newPlayerIds = [];
  // loop over incoming players
  for (var player of allPlayers) {
    if (!players.hasOwnProperty(player.personId)) {
      // grab the list of ids of newly joined players
      newPlayerIds.push(player.personId);
    }
  }

  // add players to this game
  setPlayers(allPlayers);

  // send a message to all
  // informing them of the new players
  // and sending the gamestate to the new players
  sendToGameshell({
    eventType: "sendToAll",
    message: {
      type: "setPlayers",
      data: {
        gameState: getGameState(),
        newPlayerIds: newPlayerIds,
        players: allPlayers
      }
    }
  });
}

/**
 * Sets the current selected player currently controls-enabled/allowed to play the game
 *
 * @param {*} player Player object {id, name, controlsEnabled}
 */
function setCurrentPlayerHook(player) {
  updateCurrentPlayer(player);

  // inform other game instances
  sendToGameshell({
    eventType: "sendToAll",
    message: {
      type: "updateCurrentPlayer",
      data: player
    }
  });

  // inform Gameshell about player change
  sendToGameshell({
    eventType: "setCurrentPlayer",
    message: currentPlayer
  });
}

/**
 * Updates the controls of the player (by enabling/disabling them)
 *
 * @param {*} player Player object {id, name, controlsEnabled}
 */
function updatePlayerControlsHook(player) {
  updatePlayerControls(player);

  // inform other game instances
  sendToGameshell({
    eventType: "sendToAll",
    message: {
      type: "updatePlayerControls",
      data: player
    }
  });
}

/**
 * Updates the controls of the player (by enabling/disabling them)
 *
 * @param {*} message Player object {id, name, controlsEnabled}
 */
// function requestGameStatusHook(message) {
//   // updatePlayerControls(player);
//   console.log('requestGameStatus');
//   console.log(message);
//   gameState = getGameState();

//   // inform other game instances
//   sendToGameshell({
//     eventType: 'sendToPlayers',
//     data: {
//       message: 'requestGameStatus',
//       data: gameState,
//       playerIds: [messgae.person_id]
//     }
//   });
// }

/**
 * Updates the controls of the player (by enabling/disabling them)
 *
 * @param {*} message Player object {id, name, controlsEnabled}
 */
function userJoined(message) {
  // updatePlayerControls(player);
  console.log("userJoined");
  console.log(message);

  // inform other game instances
  sendToGameshell({
    eventType: "sendToAll",
    message: {
      type: "userJoined",
      data: message
    }
  });
}

/**
 * Updates the controls of the player (by enabling/disabling them)
 *
 * @param {*} message Player object {id, name, controlsEnabled}
 */
function pauseGame(message) {
  // updatePlayerControls(player);
  console.log("pauseGame");
  console.log(message);

  // inform other game instances
  sendToGameshell({
    eventType: "sendToAll",
    message: {
      type: "pauseGame",
      data: message
    }
  });
}

/**
 * list of players that current went online
 *
 * @param {*} personIds number array of person ids
 */
function playersOnline(personIds) {
  console.log("playersOnline");
  console.log(personIds);
  for (personId of personIds) {
    if (players[personId]) {
      players[personId].isOnline = true;
    }
    if (currentPlayer && currentPlayer.personId == personId) {
      currentPlayer.isOnline = true;
    }
  }
  if (isGameMaster() && isGameStarted()) {
    gameState = getGameState();
    sendToGameshell({
      eventType: "sendToPlayers",
      playerIds: personIds,
      message: {
        type: "gameState",
        data: gameState
      }
    });
  }
}

/**
 * Returns true if any of the local players are the gamemaster
 *
 */
function isGameMaster() {
  console.log("isGameMaster");
  gamemaster = getGamemaster();
  return localPlayerIds.includes(gamemaster.personId);
}

function getGamemaster() {
  for (var playerId in players) {
    if (players[playerId].gamemaster) {
      return players[playerId];
    }
  }
}

/**
 * list of players that went offline
 *
 * @param {*} personIds number array of person ids
 */
function playersOffline(personIds) {
  console.log("playersOffline");
  console.log(personIds);
  for (personId of personIds) {
    if (players[personId]) {
      players[personId].isOnline = false;
    }
    if (currentPlayer && currentPlayer.personId == personId) {
      currentPlayer.isOnline = false;
    }
  }

  // inform other game instances
  // sendToGameshell({
  //   eventType: 'sendToAll',
  //   message: {
  //     type: 'pauseGame',
  //     data: message
  //   }
  // });
}

/**
 * Updates the controls of the player (by enabling/disabling them)
 *
 * @param {*} message Player object {id, name, controlsEnabled}
 */
function userLeft(message) {
  // updatePlayerControls(player);
  console.log("userLeft");
  console.log(message);

  // inform other game instances
  sendToGameshell({
    eventType: "sendToAll",
    message: {
      type: "userLeft",
      data: message
    }
  });
}

/**
 * Handles messages sent by other game instances or by the gameshell
 *
 * @param {*} message Data object containing a 'message' and it's associated 'data'
 */
function handleGameMessageHook(message) {
  // if game is not ready yet
  if (!isGameReady) {
    // then store the message in a queue
    messageQueue.push(message);
    return;
  }

  var messageType = message.type;
  var data = message.data;
  switch (messageType) {
    /*
     * The following required methods enable the Gameshell to appropriately interact with the game.
     */
    case "startGame":
      startGame(data.cardsOrder, data.startingPlayerId);
      break;

    case "setTheme":
      setTheme(data.theme);
      // if the game had already started before updating the theme
      if (isGameStarted()) {
        // then restart the game
        startGame(data.cardsOrder);
      }
      break;

    case "setGameset":
      setGameset(data.gameset);
      // if the game had already started before updating the gameset
      if (isGameStarted()) {
        // then restart the game
        startGame(data.cardsOrder);
      }
      break;

    // not needed in this game
    //case 'setGamesetItem':
    //  setGamesetItem();
    //  break;

    case "endGame":
      endGame();
      break;

    case "setPlayers":
      var isLocalPlayerFound = false;
      // if the local player is one of the new players
      for (var playerId of data.newPlayerIds) {
        if (localPlayerIds.includes(playerId)) {
          // then set the game state
          setGameState(data.gameState);
          isLocalPlayerFound = true;
          break;
        }
      }

      // otherwise
      if (!isLocalPlayerFound) {
        // set the players
        setPlayers(data.players);
      }
      break;
    case "setLocalPlayers":
      setLocalPlayers(data);
      break;

    case "updateCurrentPlayer":
      updateCurrentPlayer(data);
      break;

    case "updatePlayerControls":
      updatePlayerControls(data);
      break;

    // case 'userJoined':
    //     userJoined(e.data);
    //     break;

    case "pauseGame":
      pauseGame(e.data);
      break;

    // case 'userLeft':
    //     userLeft(e.data);
    //     break;

    case "playersOnline":
      playersOnline(data);
      break;

    case "playersOffline":
      playersOffline(data);
      break;

    case "setGameState":
      setGameState(data);
      break;

    case "flipCard":
      if (message.loggedInPersonId === message.senderPersonId) return;
      $(".memory-card").each((index, value) => {
        var elCard = $(value);

        if (elCard.css("order") == data) {
          flipCard(elCard);
          return false;
        }
      });
      break;
  }
}

function handleMessageQueue() {
  for (var message of messageQueue) {
    handleGameMessageHook(message);
  }
  messageQueue = [];
}
