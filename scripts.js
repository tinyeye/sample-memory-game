

$(document).ready(initialized);

// theme can be chosen from this list
let themes = {
  'default':  {
    backImage: './assets/js-badge.svg',
    backAlt: 'JS Badge',
    cardBackgroundColor: 'lightgreen',
    gameBackgroundColor: 'darkolivegreen'
  },
  'tinyeye': {
    backImage: './assets/te-butterfly.png',
    backAlt: 'TE Butterfly',
    cardBackgroundColor: '#1C7CCC',
    gameBackgroundColor: '#060AB2'
  }
};

// Gameset images can be updated in this list
let memoryCards = [
  {id: 'aurelia', frontImage: './assets/aurelia.svg', frontAlt: 'Aurelia'},
  {id: 'vue', frontImage: './assets/vue.svg', frontAlt: 'Vue'},
  {id: 'angular', frontImage: './assets/angular.svg', frontAlt: 'Angular'},
  {id: 'ember', frontImage: './assets/ember.svg', frontAlt: 'Ember'},
  {id: 'backbone', frontImage: './assets/backbone.svg', frontAlt: 'Backbone'},
  {id: 'react', frontImage: './assets/react.svg', frontAlt: 'React'}
];

let currentMemoryCards = memoryCards.slice(0);
let isCustomGameSet = false;
let maxNumberOfUniqueCards = 6;
let cardsOrder = [];

// default variables
let currentThemeName = 'default';
let currentTheme = themes['default'];
let lockBoard = false;
let firstCard, secondCard;
let matchesFound = 0;

function initialized() {
  $('#uiStartGame').click(startGameHandler);
  $('#uiRestartGame').click(startGameHandler);

  // preparing an array of card order from 0 to 'total number of cards'
  var totalCards = maxNumberOfUniqueCards * 2;
  for(var i=1; i<=totalCards; i++) {
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
    name: 'Memory Game',
    width: 640,
    height: 640,
    autoScale: false
  });

  gi.themes = themeNames;
  gi.gamesetsAllowed = true;
  gi.minimumGamesetCardsAllowed = 6;
  sendGameReady(gi);
}

function setTheme(themeName='default') {
  currentThemeName = themeName;
  currentTheme = themes[themeName];

  // set the board's background color from the theme
  $('body').css('background', currentTheme.gameBackgroundColor);
  // since changing the theme will affect the cards
  // check if the game is already started
  if (isGameStarted()) {
    // then restart it again
    startGameHook(null, true);
  }
}

/**
 * @returns True if the game has already started. False otherwise
 */
function isGameStarted() {
  // if the game area is visible, then the game has started
  return $('#uiGameArea').is(':visible');
}

function createCard(id, frontImage, frontAlt='') {
  // create the div that will hold the card's front and back faces
  var elDiv = $('<div class="memory-card"></div>');
  elDiv.attr('data-id', id);

  // create the front face image
  var elFrontImage = $('<img class="front-face"></img>');
  elFrontImage.css('background', currentTheme.cardBackgroundColor);
  elFrontImage.attr('src', frontImage);
  elFrontImage.attr('alt', frontAlt);

  // create the back face image
  var elBackImage = $('<img class="back-face"></img>');
  elBackImage.css('background', currentTheme.cardBackgroundColor);
  elBackImage.attr('src', currentTheme.backImage);
  elBackImage.attr('alt', currentTheme.backAlt);

  // add the front and back faces to the div
  elDiv.append(elFrontImage);
  elDiv.append(elBackImage);
  
  // listen for card click
  elDiv.click(cardClickHandler);

  return elDiv;
}

function createGameCards() {
  // prepare game area
  var elGameArea = $('#uiGameArea');
  // remove all cards
  elGameArea.empty();
  // count cards
  var cardCount = 0;
  // each card has to be added twice so we have double the number of cards
  var totalCards = maxNumberOfUniqueCards * 2;
  // create new cards
  for(var card of currentMemoryCards) {
    // each card has to be created twice
    for(var i=0; i<2; i++) {
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
function startGame() {
  // reset # of found matches
  matchesFound = 0;
  // reset game variables
  lockBoard = false;
  firstCard = secondCard = null;
  
  // hide game over screen (if visible)
  $('#uiGameOver').hide();
  // hide main menu screen
  $('#uiMainMenu').hide();
  // create/recreate the game cards
  createGameCards();
  // show game area
  $('#uiGameArea').show();
}

/**
 * Ends the game
 * Advances the game from the game area into the Ending screen
 */
function endGame() {
  // hide the game area
  $('#uiGameArea').hide();
  // show the game over area
  $('#uiGameOver').show();
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
  // if we are clicking the same first flipped card, return
  if (card === firstCard) return;

  // otherwise, flip the card
  card.addClass('flip');

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
  var isMatch = firstCard.attr('data-id') === secondCard.attr('data-id');
  isMatch ? disableCards() : unflipCards();
}

/**
 * Disable click events on both cards.
 * If all matches have been found, then end the game
 * Otherwise, start a new turn
 */
function disableCards() {
  firstCard.off('click');
  secondCard.off('click');

  matchesFound++;

  if (matchesFound < maxNumberOfUniqueCards) {
    newTurn();
  } else {
    setTimeout(() => {
      endGameHook(true);
    }, 1000);
  }
}

/**
 * Lock the board, unflip the cards, then start a new turn
 */
function unflipCards() {
  lockBoard = true;

  setTimeout(() => {
    firstCard.removeClass('flip');
    secondCard.removeClass('flip');

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

// ===========================================================================
// EVENT HANDLERS
// ===========================================================================

function startGameHandler() {
  startGameHook(null, true);
}


function endGameHandler() {
  endGameHook(true);
}

function cardClickHandler() {
  // grab the card being flipped
  var elCard = $(this);
  // handle card flipping/unflipping...etc
  flipCard(elCard);
  // send a gameMessage to other game instances
  sendGameMessage({message: 'flipCard', data: elCard.css('order')});
}

// =============================================

//
// Each of the following Hook functions MUST receive a data object and an eventInitiator
// The eventInitiator indicates whether the initiator of this event is THIS instance of the game
// (or the GameShell associated with THIS instance of the game). In which case the eventInitiator is True.
// Otherwise, the eventInitiator is False. When it is False, these hooks should NOT call the 'send' methods
// otherwise we will end up with infinite loop.
//
// The data object comes from three sources:
// 1- From the Gameshell when the gameshell is the initiator of the event (e.g., user clicked Start Game on GameShell)
// 2- From THIS game instance when the user clicks inisde the game (e.g., flipping a card)
// 3- From other game instances when the user interacts with those instances, a message is sent here.
// 
// 2nd and 3rd instances are controlled here. We decide what to send to other game instances, and we decide 
// how to call the hooks internally. So we control the value of the Data object.
// The 1st instance, however, comes from the Gameshell. The standard information sent from the Gameshell
// is described next to each function below. 

/**
 * Starts the game. If an initial state is sent in, then use that to initialize the game.
 * If no initial game state is sent in, then after starting the game, send back the current game state
 * so that it gets used by other Gameshells to initialize their games.
 * 
 * @param {*} gameState Initial game state sent by other game instances. Null if this 
 *                      game (or Gameshell) is initiating the event
 * @param {boolean} eventInitiator Whether this hook call is responding to an event started
 *                                 in another game instance OR it is initiaing the event itself
 */
function startGameHook(gameState, eventInitiator=false) {
  
  // if we have an incoming gameState
  if (gameState) {
    // use it to start our game
    // the game state of the Memory Game consists of a list of card order
    cardsOrder = gameState;
  } else {
    // shuffle the built-in card order list and get a copy into the gameState
    gameState = shuffleList(cardsOrder);
  }

  // start/restart the game
  // the cardsOrder list will be used in the start process
  startGame();

  // if we are initiating the event
  if (eventInitiator) {
    // send to the GameShell a 'gameStarted' message along with the game state
    sendGameStarted(gameState);
  }
}

/**
 * Ends the game
 * 
 * @param {*} data Data object sent by other game instances. Null if this game (or Gameshell) is initiating the event
 * @param {boolean} eventInitiator Whether this hook call is responding to an event started
 *                                 in another game instance OR it is initiaing the event itself
 */
function endGameHook(data, eventInitiator=false) {
  // for this game, we don't send/receive a data object on gameEnd events

  // end the game
  endGame();
  // if we are initiating the event
  if (eventInitiator) {
    // broadcast the event
    sendGameEnded();
  }
}

/**
 * Changes the theme of the game based on the theme name passed to it
 * 
 * @param {string} theme Name of theme to be applied. Must send a 'string' to other game instances.
 * @param {boolean} eventInitiator Whether this hook call is responding to an event started
 *                                 in another game instance OR it is initiaing the event itself
 */
function changeThemeHook(theme, eventInitiator=false) {
  // change the theme
  setTheme(theme);
  // if we are initiating the event
  if (eventInitiator) {
    // send to GameShell
    sendThemeChanged(theme);
  }
}

/**
 * Changes the gameset for this game.
 * 
 * @param {*} data If call initiated by the Gameshell, then this is the gameset to be used in this game.
 *                 It has the following structure: {cards: [{id, path, label}], isOrdered, name}
 *                 If the call is initiated by another game instance, then this object consists 
 *                 of whatever we sent from inside the game (see sendGamesetChanged() at the end of the function).
 * @param {boolean} eventInitiator Whether this hook call is responding to an event started
 *                                 in another game instance OR it is initiaing the event itself
 */
function changeGamesetHook(data, eventInitiator=false) {
  var gameset = data.hasOwnProperty('gameset') ? data.gameset : data;
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
      currentMemoryCards.push({id: card.id, frontImage: card.path, frontAlt: card.label});
    }
  }

  // restart the game if it has already been started
  var gameState = data.hasOwnProperty('cardsOrder') ? data.cardsOrder : null;
  if (isGameStarted()) {
    if (gameState) {
      cardsOrder = gameState;
    } else {
      // shuffle the cards
      gameState = shuffleList(cardsOrder);
    }

    // restart the game
    // the cardsOrder AND currentMemoryCards lists will be used in starting the game
    startGame();
  }

  // if we are initiating the event
  if (eventInitiator) {
    // send back to Gameshell
    sendGamesetChanged({gameset: gameset, cardsOrder: gameState});
  }
}

/**
 * Changes the current gameset card into a previous or next card.
 * 
 * @param {string} direction The direction to change the gameset card. 'Next' to go forward or
 *                           'previous' to go backwards.
 * @param {*} data Data needed to help move to next/previous gameset card. Could be the 
 *                 gameset card itself that got changed to in the initiator game instance
 * @param {boolean} eventInitiator Whether this hook call is responding to an event started
 *                                 in another game instance OR it is initiaing the event itself
 */
function changeGamesetItemHook(direction, data=null, eventInitiator=false) {
  // this event is not handled in this game
  
  // if handled, don't forget to send back a message
  // if (eventInitiator) {
  //   sendGamesetItemChanged(direction, data);
  // }
}

/**
 * Handles messages sent by other instances of this game
 * No need for eventInitiator because all game messages received don't need to be broadcasted
 * 
 * @param {*} messageInfo Data object containing a 'message' and it's associated 'data'
 */
function handleGameMessageHook(messageInfo) {
  switch (messageInfo.message) {
    case 'flipCard':
      $('.memory-card').each(() => {
        var elCard = $(this);

        if (elCard.css('order') == messageInfo.data) {
          flipCard(elCard);
          return false;
        }
      });
      break;
  }
}


/**
 * Grabs all information necessary to rebuilt the THIS game's state in another game instance.
 * Used mainly when another game instance joins the game in the middle of game play
 */
function getGameStateHook() {
  // for this game, we need to send
  // - cardsOrder
  // - gameset (stored in 'currentMemoryCards' here)
  // - selected theme
  // - NOT APPLICAPLE HERE - current game set image
  // - information about which cards are flipped, the rest are unflipped

  // prepare flipped card information
  var flippedCards = [];
  $('.memory-card').each(() => {
    elCard = $(this);

    if (elCard.hasClass('flip')) {
      flippedCards.push(elCard.css('order'));
    }
  });

  sendGameState({
    cardsOrder: cardsOrder,
    currentMemoryCards: isCustomGameSet ? currentMemoryCards : null,
    themeName: currentThemeName,
    flippedCards: flippedCards,
    isGameStarted: isGameStarted(),
    firstCardOrder: firstCard ? firstCard.css('order') : '',
    secondCardOrder: secondCard ? secondCard.css('order') : ''
  });
}

/**
 * Updates the current game's state to match the incoming state
 * 
 * @param {*} gameState The game state information
 */
function setGameStateHook(gameState) {
  if (!gameState) return;

  // set the cards order
  cardsOrder = gameState.cardsOrder;

  // set the gameset (if any)
  if (gameState.currentMemoryCards) {
    currentMemoryCards = gameState.currentMemoryCards;
  }

  // set theme (if changed)
  if (gameState.themeName != 'default') {
    currentThemeName = themeName;
    currentTheme = themes[themeName];
    $('body').css('background', currentTheme.gameBackgroundColor);
  }

  // start/restart the game
  startGame();

  // flip cards to match already running game's state
  $('.memory-card').each(() => {
    elCard = $(this);
    
    var cardOrder = elCard.css('order');
    if (gameState.flippedCards.includes(cardOrder)) {
      // flip the card
      elCard.addClass('flip');

      // check if we already have a first/second card then set them up
      if (cardOrder == gameState.firstCardOrder) {
        firstCard = elCard;
      } else if (cardOrder == gameState.secondCardOrder) {
        secondCard = elCard;
      }
    }
  });

  // if both cards are selected
  if (firstCard && secondCard) {
    // then check for a match
    checkForMatch();
  }
}