# Game Developer Instructions:

The first step is to include `gameshell.js` in your project.

The second step is to interact with the GameShell through the functionality provided inside `gameshell.js`.

1. __Event Initiator__
    * A game instance is considered the initiator of the event if the event initiated because of an internal event in the game or because of an event initiated by the Gameshell in which the game instance is loaded.
    * In the latter case, the Gameshell will send a `boolean` called `eventInitiator` indicating whether or not the event initiated inside of it.
    * The importance of an event initiator is that we should always call the appropriate __Feedback Functions__ whenever the game is an event initiator.

2. __Feedback Functions__
    * Functions that need to be called by an event initiator game instance to announce different events.

    * __`sendGameReady(gameInfo)`__
      - To be called once the game is ready to start. The game, however, should NOT start the game automatically. Instead, the game should stay on an intro screen or a main menu screen until the `startGameHook()` function is called.
      - Need to pass the game information object with it. The game information object should be created using the `GameInfo` class defined in the `gameshell.js` file.
      - Each game should define it's own themes. The list of theme names should be sent to the Gameshell inside the `GameInfo` object.

    * __`sendGameStarted(data)`__
      - To be called once the game has started.
      - To be called only if the game is the initiator of this game start event.
      - The `data` object passed to this function call will be received by other game instances in the `startGameHook()` function.
      - The `data` object should help other game instances start the game in a way that matches the initiator game.

    * __`sendGameEnded(data)`__
      - To be called once the game has ended.
      - To be called only if the game is the initiator of this game end event.
      - The `data` object passed to this function call will be received by other game instances in the `endGameHook()` function.
      - The `data` object should help other game instances end the game in a way that matches the initiator game.

    * __`sendGameMessage(data)`__
      - To be called whenever a game wants to pass data to other game instances.
      - The `data` object passed to this function call will be received by other game instances in the `handleGameMessageHook()` function.
    
    * __`sendThemeChanged(data)`__
      - To be called whenever a game's theme has been changed.
      - To be called only if the game is the initiator of this theme change event.
      - The `data` object passed to this function call will be received by other game instances in the `changeThemeHook()` function.
      - The `data` object should help other game instances change the theme in a way that matches the initiator game.

    * __`sendGamesetChanged(data)`__
      - To be called whenever a game's gameset has been changed.
      - To be called only if the game is the initiator of this gameset change event.
      - The `data` object passed to this function call will be received by other game instances in the `changeGamesetHook()` function.
      - The `data` object should help other game instances change the gameset in a way that matches the initiator game.

    * __`sendGamesetItemChanged(data)`__
      - To be called whenever a game's gameset item has been changed.
      - To be called only if the game is the initiator of this gameset item change event.
      - The `data` object passed to this function call will be received by other game instances in the `changeGamesetItemHook()` function.
      - The `data` object should help other game instances change the gameset item in a way that matches the initiator game.

    * __`sendGameState(data)`__
      - To be called whenever the game's state has been requested.
      - The `data` object passed to this function call will be received by other game instances in the `setGameStateHook()` function.
      - The `data` object sould contain the game state. The game state is all information necessary for other game instances to change their state to match the initiator game.

3. __Function Hooks__

    * The following functions need to be implemented by the Game developer. They will be called by the Gameshell whenever an event occurs in the Gameshell itself, or an event occurs in another game instance from the same session.

    * If the event occurs in the Gameshell, then the game will receive `True` in the `eventInitiator` parameter. Otherwise, it will receive `False`.

    * __`startGameHook(data, eventInitiator=false)`__
      - Will be called whenever the Gameshell's 'Start Game' button is clicked OR whenever another game instance in the same session has started
      - Whenever called, it should reset the game's variables and start/restart the game
      - If the initiator is the Gameshell, then the `data` object will be `null`. In this case the game should start the game and generate a game state object that helps remote instances to start and match this game
      - If the initiator is a remote game instance, then it might send in a `data` object to help start this instance to match the remote one
      - Once the game is started/restarted, call `sendGameStarted()` and send the game state object with it (if applicable)

    * __`endGameHook(data, eventInitiator=false)`__
        - Will be called whenever the Gameshell's 'End Game' button is clicked OR whenever another game instance in the same session has ended
        - Whenever called, it should take the game to it's final screen where the results of the game are displayed
        - Once the game is ended, call `sendGameEnded()`
        - __NOT IMPLEMENTED YET__ - maybe an image/animation will be sent from the Gameshell to display as a reward for the student

    * __`changeThemeHook(data, eventInitiator=false)`__
        - Each game needs to define it's own themes. The game should send the list of theme names to the Gameshell with the `gameReady` event in the `GameInfo` object. The first theme should always be called `default`
        - The Gameshell can request to change the theme to one of the names provided by the game
        - `changeThemeHook()` will be called whenever the user selects a theme in the Gameshell
        - If no theme is selected, the `default` should always be used
        - Once a theme is changed, call `sendThemeChanged()` and send the theme's name with it for other game instances

    * __`changeGamesetHook(data, eventInitiator=false)`__
        - Each game sends a flag with the `gameReady` event in the `GameInfo` object to indicate whether or not it accepts Gamesets
        - The game also needs to send - again with the `gameReady` event - the minimum number of gameset cards required from any gameset sent to the game
        - Each game needs to have it's own `default` gameset which is used whenever no gameset is assigned to the game
        - `changeGamesetHook()` will be called whenever the user selects a different gameset in the Gameshell
        - Once gameset is changed, call `sendGamesetChanged()` and send the gameset details with it so that it gets forwarded to other game instances
        - If no gamesets allowed for this game, then the game can ignore this hook (do nothing inside the implementation)
        - The gameset object received should have the following structure:
        `{cards: [{id, path, label}], isOrdered, name}`
      
    * __`changeGamesetItemHook(direction, data, eventInitiator=false)`__
        - `direction` will be either `next` or `previous`
        - Will be called whenever the Gameshell user clicks the'Next' or 'Previous' buttons to navigate through the gameset cards
        - The game has the option to ignore this hook (do nothing inside the implenetation) based on type of gameplay
        - Once the gameset item is changed, call `sendGamesetItemChanged()` and send the item that is selected

    * __`handleGameMessageHook(data)`__
        - Will be called whenever another game instance broadcasts a message to other game instances in the same session.
      
    * __`getGameStateHook()`__
        - Called by the Gameshell to pull a full state of the game. The state should be good enough to set any other game instance to the same state of the current game.

    * __`setGameStateHook(data)`__
        - Called by the Gameshell to set the state of a game instance. The game should know how to handle the state and restart the game.

    * __`setGameshellInfoHook(data)`__
        - Once the game is ready and the `sendGameReady()` is called, the Gameshell will send it's information to the game through this hook
        - The object that gets sent by the Gameshell has the following structure:
        `{userType}`
        - `userType` could be `'Student'`, `'Therapist'`, or `'2Students'`