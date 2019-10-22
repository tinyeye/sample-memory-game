# Game Developer Instructions:

The first step is to include `gameshell.js` in your project. Alternatively, you can use `gameshell.js` as a guide and create your own file.

The `gameshell.js` file contains a function that receive incoming messages from the Gameshell and forwards it to the appropriate hanedlers (called hooks in this example). It also contains a function that sends a message to the Gameshell. In addition, it defines the GameInfo class, a function to log messages to console, and a generic way to bind to events.

The game loaded on the `Therapist`'s side will receive events from it's game shell (for example: `startGame` or `endGame` events). It is the game's responsibility to forward such events to other game instances. This game instance is considered to be the `server` for other games in the session.

The second step is to interact with the GameShell through the functionality provided inside `gameshell.js`.

1. __Sending a message to Gameshell__
    
    Once the game is ready, it needs to send a `gameReady` event to the Gameshell. The data object sent with this event should be of type GameInfo (the object is defined in `gameshell.js`)

    The `gameReady` event means that the game is ready to start. However, it must be noted that the game shouldn't start on it's own. It should instead wait for the `startGame` event from the Gameshell. After the game is ready and before it starts, the game could be in an idle screen, a main menu screen, or just a title screen to name a few examples.

    The structure of the `GameInfo` object is:
    ```
    {
      name: string;
      width: int;
      height: int;
      autoScale: boolean;
      themes: [string];
      gamesetsAllowed: boolean;
      minimumGamesetCardsAllowed: int;
      isTurnTaking: boolean;
    }
    ```
    `name` - *Required. The name of the game
    
    `width` - *Required. Width of the game
    
    `height` - *Required. Height of the game
    
    `autoScale` - *Required. Is this game allowed to be scaled, or does the Gameshell have to abide by the width x height. `True` by default.

    `isTurnTaking` - *Required. Indicates whether this game has turns or not. `False` by default.

    `themes` - Optional. List of theme names available, first theme MUST be 'default'. If not provided, the game will be considered not to have any themes

    `gamesetsAllowed` - Optional. Indicates whether this game allows gamesets to be loaded. If not provided, the game is considered not to accept any gamesets

    `minimumGamesetCardsAllowed` - Optional. Minimum number of gameset cards required per gameset. If not provided and 'gamesetsAllowed' is true, then any number of gameset cards is allowed

    Messages sent must be a JSON string and are expected to have the following structure:
    ```
    {
      tineye: true,
      type: string,
      playerIds: [int],
      data: object
    }
    ```

    `tinyeye: true` - must exist on this object to be accepted by the Gameshell
    
    `type` - A string message type. It must be one of the following: [`gameReady`, `sendToAll`, `sendToPlayers`, `currentPlayerChanged`]

    `playerIds` - A list of player ids to send the message to. Will be used ONLY when the message type is `sendToPlayers`. Otherwise it is ignored.

    `data` - A `GameInfo` object when the message type is `gameReady`. A `player` object - `{id, name, controlsEnabled, gameMaster}` - when the message type is `currentPlayerChanged`. Any other object otherwise.

1. __Handling Gameshell Messages__

    The game should listen for incoming messages through the `message` event on the current `window` object.

    The following messages will be sent to the game ONLY from the Therapist's Gameshell side:
    * __`startGame`__
      Prompts the game to start. No data object is sent with this event.
      
    * __`setTheme`__
      Sets the theme of the game. The Gameshell will provide the theme name to change to. The list of theme names had already been provided to the Gameshell in the GameInfo class when the game sends the `gameReady` event to the Gameshell.

    * __`setGameset`__
      Sets the gameset of the game. Each game needs to provide it's default gameset in case no gameset was assigned by the Gameshell. The Gameset object received by the game will have the following structure:
      ```
      { name: string, isOrdered: boolean, cards: [{label, path, order}] }
      ```

      The minimum number of cards acceptable by the game is sent to the Gameshell in the GameInfo object when the game sends the `gameReady` event to the Gameshell.

    * __`setPreviousGamesetCard`__
      Prompts the game to go back to the previous game card from the currently loaded gameshell. No data object is sent with this event.

    * __`setNextGamesetCard`__
    Prompts the game to advance to the next game card from the currently loaded gameshell. No data object is sent with this event.

    * __`endGame`__
    Prompts the game to end. No data object is sent with this event.

    * __`setPlayers`__
    Sets the players of the game. The Therapist is considered a player and will be included in this list. It is up to the game to decide how to handle the Therapist. The therapist, for example, could be allowed different types of controls in the game, or could be allowed to play at any time even in turn taking games. The data object will contain the full list of players currently playing this game. The structure of the data object is:
    ```
    [{id, name, controlsEnabled, gameMaster}]
    ```

    * __`setCurrentPlayer`__
    Sets the current player who is actively playing the game. This is useful for turn-taking games where only one player can play at a time. The game can declare itself to be `isTurnTaking` when sending the GameInfo object. The game MUST respect the current player - in turn taking games - and allow only them to interact with the game, and also prevent others from doing so

    * __`updatePlayerControls`__
    Updates the `controlsEnabled` flag of a player's object. The game must respect this variable and prevent the player from interacting with the game if the controls are not enabled.

    The following messages will be sent to the game from their respective Gameshell sides:
    * __`gameMessage`__
    Whenever a game sends a `sendToAll` or `sendToPlayers` message to the Gameshell, the Gameshell in turn will forward this message to all other games or to a set of players, respectively. The message received by other game(s) is received in the `gameMessage` event. The game should know how to handle such messages as they were sent by the game itself (from another instance).

    * __`setGameshellInfo`__
    Whenever the game sends the `gameReady` event to the Gameshell, the Gameshell will respond by sending the game a `setGameshellInfo` message. Through this message, the Gameshell will introduce itself by sending an object with the following structure:
    ```
    {
      userType: 'Therapist'|'Student'|'2Students',
      players: [{id, name, controlsEnabled}],
      currentPlayer: {id, name, controlsEnabled, gameMaster}
    }
    ```

    `userType` - The type of the user of the current Gameshell where this game is loaded. Currently, the gameshell user type can be one of three values: `Therapist`, `Student`, or `2Students`. A `Therapist` user has controls that enable special interaction with the game. `Student` means only one student is at the computer playing the game. `2Students` means two students are at one computer playing the game. Students can only interact with the game itself. No special controls on their end.

    `players` - The list of __local player(s)__ currently connected to the Gameshell loading this game instance.

    `currentPlayer` - In turn taking games, this is the current player allowed to interact with the game.