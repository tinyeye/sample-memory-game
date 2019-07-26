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

let currentMemoryCards = memoryCards;

// default variables
let currentTheme = themes['default'];
let lockBoard = false;
let firstCard, secondCard;
let matchesFound = 0;

function initialized() {
  $('#uiStartGame').click(startGameHandler);
  $('#uiRestartGame').click(restartGameHandler);

  setTheme();
}

function setTheme(themeName='default') {
  currentTheme = themes[themeName];
  
  sendToParent('themeChanged');

  $('body').css('background', currentTheme.gameBackgroundColor);
  if ($('#uiGameArea').is(':visible')) {
    restartGameHandler();
  }
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
  elDiv.click(flipCard);

  return elDiv;
}

function createGameCards() {
  // prepare game area
  var elGameArea = $('#uiGameArea');
  // remove all cards
  elGameArea.empty();
  // count only 6 cards
  var cardCount = 0;
  // create new cards
  for(var card of currentMemoryCards) {
    // each card has to be created twice
    for(var i=0; i<2; i++) {
      // create a card element
      var elCard = createCard(card.id, card.frontImage, card.frontAlt);
      // put it at random order
      elCard.css("order", Math.floor(Math.random() * 12));
      // add it to the game area
      elGameArea.append(elCard);
    }
    cardCount++;
    if (cardCount == 6) {
      break;
    }
  }
}

function restartGameHandler() {
  // reset # of found matches
  matchesFound = 0;
  // reset game variables
  lockBoard = false;
  firstCard = secondCard = null;
  // start a new game
  startGameHandler();
}

function startGameHandler() {
  // hide game over screen (if visible)
  $('#uiGameOver').hide();
  // hide main menu screen
  $('#uiMainMenu').hide();
  // create/recreate the game cards
  createGameCards();
  // show game area
  $('#uiGameArea').show();
  // send a message
  sendToParent('gameStarted');
}

function endGameHandler() {
  // hide the game area
  $('#uiGameArea').hide();
  // show the game over area
  $('#uiGameOver').show();
  // send a message
  sendToParent('gameEnded');
}

function flipCard(event) {
  var elCard = $(this);
  if (lockBoard) return;
  if (elCard === firstCard) return;

  elCard.addClass('flip');

  if (firstCard == null) {
    // first click
    firstCard = elCard;
  } else {
    // second click
    secondCard = elCard;
    checkForMatch();
  }
}

function checkForMatch() {
  var isMatch = firstCard.attr('data-id') === secondCard.attr('data-id');
  isMatch ? disableCards() : unflipCards();
}

function disableCards() {
  firstCard.off('click');
  secondCard.off('click');

  matchesFound++;

  if (matchesFound < currentMemoryCards.length) {
    newTurn();
  } else {
    setTimeout(() => {
      endGameHandler();
    }, 1000);
  }
}

function unflipCards() {
  lockBoard = true;

  setTimeout(() => {
    firstCard.removeClass('flip');
    secondCard.removeClass('flip');

    newTurn();
  }, 1500);
}

function newTurn() {
  lockBoard = false;
  firstCard = secondCard = null;
}

// =============================================

// addEventListener support for IE8
function bindEvent(element, eventName, eventHandler) {
  if (element.addEventListener) {
      element.addEventListener(eventName, eventHandler, false);
  } else if (element.attachEvent) {
      element.attachEvent('on' + eventName, eventHandler);
  }
}

function sendToParent(eventType, data=null) {
  if (window && window.parent) {
    window.parent.postMessage(JSON.stringify({
      tinyeye: true,    // REQUIRED - important for filtering GameShell messages
      type: eventType,
      data: data
    }), '*');
  }
}

bindEvent(window, 'message', function(e) {
  if (String(e.data).search('"tinyeye":true') >= 0) {
    e = JSON.parse(e.data);
    switch (e.type) {
      case 'startGame':
        restartGameHandler();
        break;

      case 'endGame':
        endGameHandler();
        break;

      case 'changeTheme':
        setTheme(e.data);
        break;

      case 'changeToPreviousGamesetItem':
        // not handled in this game
        // need to send back 'gamesetItemChangedToPrevious'
        break;

      case 'changeToNextGamesetItem':
        // not handled in this game
        // need to send back 'gamesetItemChangedToNext'
        break;

      case 'changeGameset':
        let gameset = e.data;
        
        if (gameset == null) {
          currentMemoryCards = memoryCards;
        } else {
          currentMemoryCards = [];
          for (var card of gameset.cards) {
            currentMemoryCards.push({id: card.id, frontImage: card.path, frontAlt: card.label});
          }
          restartGameHandler();
        }
        sendToParent('gamesetChanged');
        break;
    }
  }
});

// send a message to parent window that this document is ready
if (window && window.parent) {
  
  // prepare theme names available in the game
  let themeNames = [];
  for(var themeName in themes) {
    themeNames.push(themeName);
  }

  // non required properties can removed from the object
  // gameReady event should introduce the game to the GameShell
  // all games that require gamesets should have their own default images in case a gameset wasn't available
  sendToParent('gameReady', {
    gameName: 'Memory Game',  // REQUIRED - name of the game
    gameWidth: '640',         // REQUIRED - width of the game
    gameHeight: '640',        // REQUIRED - height of the game
    autoScale: false,         // REQUIRED - is this game allowed to be scaled, or does it have to abide by the width x height
    themeNames: themeNames,   // list of theme names available, one theme name MUST be 'default'
    gamesetsAllowed: true,    // indicates whether this game allows gamesets to be loaded
    minGamesetCards: 6        // minimum number of images per gameset
  });
}