# Game Developer Instructions

## Introduction

These instructions are intended to help you develop and test games that will work in the platform.  Therapists use our platform to provide therapy to students. Games are used to create a more engaging experience for students during therapy.  

The sample-memory-game project is given as example implementation of a game that works in the platform. 
These instructions can be tested out using the sample-memory-game project.

## Terms

**gameshell** - Deployed piece of software that is used to verify that your game is functioning as you expect within our platform. The gameshell's functionality duplicates what is in the platform where these
games will be deployed.

**gameset** - a group of gameset_cards.

**gameset_cards** - a group of labeled images that are used for therapy.

## Gameplay

Gameplay is defined on the Gameplay document that was included.

## Testing Games

Games can be tested using our [Gameshell](https://www.gameshell.tinyeye.com) (gameshell.tinyeye.com).

To test your game you'll have to deploy it (locally or otherwise) to test it with the gameshell.

To connect you'll use the following credentials for the therapist and e-helper. You must log in with the therapist before logging in as an e-helper. The channel_id that is generated when a therapist logs in must be used when logging as an e-helper.  This channel_id is used to communicate between the 2 sessions.

For the e-helper side you must also provide the channel_id that was generated after logging in as a therapist.

Here's a video using the gameshell to test the sample-memory-game.

<a href="http://www.youtube.com/watch?feature=player_embedded&v=hllhz8hnjJ8
" target="_blank"><img src="http://img.youtube.com/vi/hllhz8hnjJ8/0.jpg" 
alt="IMAGE ALT TEXT HERE" width="240" height="180" border="10" /></a>

### Credentials

 | username | password | channel_id |
 | -------- | -------- | ---------- |
 | therapist| Games!   | (LEAVE BLANK) |
 | ehelper  | Games!   | (channel_id from therapist side) |

## Include gameshell.js

The first step is to include `gameshell.js` in your project. Alternatively, you can use `gameshell.js` as a guide and create your own file.  All communication between the game and gameshell happen through the `gameshell.js` file.  the file is commented well and will help you in using it or developing your own equivalent `gameshell.js` file.  

The game loaded on the `Therapist`'s side will receive events from it's game shell (for example: `startGame` or `endGame` events). It is the game's responsibility to forward such events to other game instances. This game instance is considered to be the `server` for other games in the session.

## Sending a Message to Gameshell

The second step is to interact with the GameShell through the functionality provided inside `gameshell.js` file.

Once the game is ready, it needs to send a `gameReady` event to the Gameshell. The data object sent with this event should be of type GameInfo This object is defined in `gameshell.js`.

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
  allowGameCardNavigation: boolean;
}
```

`name` - *Required. The name of the game

`width` - *Required. Width of the game

`height` - *Required. Height of the game

`autoScale` - *Required. Is this game allowed to be scaled, or does the Gameshell have to abide by the width x height. `True` by default.

`isTurnTaking` - *Required. Indicates whether this game supports turn playing. `False` by default

`allowGameCardNavigation` - *Required. Indicates whether this game allows the therapist to navigate the game cards manual or not. Some games do not require game card navigation e.g. Sample Memory Game. `False` by default.

`themes` - Optional. List of theme names available, first theme MUST be 'default'. If not provided, the game will be considered not to have any themes

`gamesetsAllowed` - Optional. Indicates whether this game allows gamesets to be loaded. If not provided, the game is considered not to accept any gamesets

`minimumGamesetCardsAllowed` - Optional. Minimum number of gameset cards required per gameset. If not provided and 'gamesetsAllowed' is `true`, then any number of gameset cards is allowed

Messages sent must be a JSON string and are expected to be of GameGameshellMessage type with the following structure:

```
{
  tinyeye: true,
  eventType: string,
  message: object,
  playerIds: [int]
}
```

`tinyeye: true` - must exist on this object to be accepted by the Gameshell

`eventType` - An event type. It must be one of the following: [`gameReady`, `sendToAll`, `sendToPlayers`, `setCurrentPlayer`]

`playerIds` - A list of player ids to send the message to. Will be used ONLY when the message type is `sendToPlayers`. Otherwise it is ignored.

`message` - This is a generic message object that will have different data depending on the eventType property. The table below lays out what message object type is expected for what eventType.  The message object types are defined in `gameshell.js`

| eventType        | message object type           |
| ---------------- | ----------------------------- |
| gameReady        | `GameInfo` object             |
| setCurrentPlayer | `GameParticipant` object      |
| sendToAll        | `GameshellGameMessage` object |
| sendToPlayers    | `GameshellGameMessage` object |

## Receiving a message from the Gameshell

The game should listen for incoming messages through the `message` event on the current `window` object.  This happens from the [EventTarget.addEventListener()](https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/addEventListener) method.  The ```bindEvent()``` method is a wrapper for the `addEventListener()` in the `gameshell.js` file.

The following messages will be sent to the game from the Therapist's Gameshell side:

`startGame` - Prompts the game to start and sends a 'startGame' [gameMessage](#gameMessage) type to all game participants. 
  
`setTheme` - Sets the theme of the game. The Gameshell will provide the theme name to change to. The list of theme names had already been provided to the Gameshell in the GameInfo class when the game sends the `gameReady` event to the Gameshell. Sends a 'setTheme' [gameMessage](#gameMessage) type to all game participants. 
  
`setGameset` - Sets the gameset of the game. Each game needs to provide it's default gameset in case no gameset was assigned by the Gameshell. Sends a 'setGameset' [gameMessage](#gameMessage) type to all game participants. The Gameset object received by the game will have the following structure:
  
  ```
  {
    id: number,
    name: string,
    language: {
      id: number,
      label: string
    }
    media_type: {
      id: number,
      label: string
    }
    status: [{
      id: number,
      label: string
    }],
    file: {
      id: number,
      name: string,
      url: string
    },
    cards: [
      {
        id: number,
        label: string,
        order: number,
        file: {
          id: number,
          name: string,
          url: string
        },
        status: {
          id: number,
          label: string
        }
      }
    ]
  }
  ```

The minimum number of cards acceptable by the game is sent to the Gameshell in the GameInfo object when the game sends the `gameReady` event to the Gameshell.

`setPreviousGamesetCard` - The usage of this depends on the game. It prompts the game to go back to the previous game card from the currently loaded gameshell. No data object is sent with this event.  Sends a 'setGamesetItem' [gameMessage](#gameMessage) type to all game participants. 

`setNextGamesetCard` - The usage of this depends on the game. It prompts the game to advance to the next game card from the currently loaded gameshell. No data object is sent with this event.  Sends a 'setGamesetItem' [gameMessage](#gameMessage) type to all game participants. 

`endGame` - Prompts the game to end and sends an 'endGame' [gameMessage](#gameMessage) to all game participants. 

`setPlayers` - Sets the players of the game and sends a 'setPlayers' [gameMessage](#gameMessage) to all game participants. The Therapist is considered a player and will be included in this list. It is up to the game to decide how to handle the Therapist. The therapist, for example, could be allowed different types of controls in the game, or could be allowed to play at any time even in turn taking games. The data object will contain the full list of players currently playing this game. This is an array of `GameParticipant` objects as defined in the `gameshell.js` file.

`setCurrentPlayer` - Sets the current player who is actively playing the game and sends a 'updateCurrentPlayer' [gameMessage](#gameMessage) to all game participants. This is useful for turn-taking games where only one player can play at a time. The game can declare itself to be `isTurnTaking` when sending the GameInfo object. The game MUST respect the current player - in turn taking games - and allow only them to interact with the game, and also prevent others from doing so.

`updatePlayerControls` - Updates the `controlsEnabled` flag of a player's object and sends a 'updatePlayerControls' [gameMessage](#gameMessage) to all game participants. The game must respect this variable and prevent the player from interacting with the game if the controls are not enabled.

The following messages will be sent to the game from their respective Gameshell sides:

<a name="gameMessage"></a>

`gameMessage`
Whenever a game sends a `sendToAll` or `sendToPlayers` message to the Gameshell, the Gameshell in turn will forward this message to all other games or to a set of players, respectively. The message received by other game(s) is received in the [gameMessage](#gameMessage) event. The game should know how to handle such messages as they were sent by the game itself (from another instance).

`setGameshellInfo`- Whenever the game sends the `gameReady` event to the Gameshell, the Gameshell will respond by sending the game a `setGameshellInfo` message. Through this message, the Gameshell will introduce itself by sending an object with the following structure:

``` javascript
{
  userType: number, // student = 1, therapist = 2, ehelper = 3
  players: [GameParticipant],
  currentPlayer: GameParticipant 
}
```

- `userType` - The type of the user of the current Gameshell where this game is loaded. Currently, the gameshell user type can be one of three values: 1 (Student), 2 (Therapist),  3 (E-Helper). A `Therapist` user has controls that enable special interaction with the game.

- `players` - The list of __player(s)__ currently connected to the Gameshell loading this game instance.

- `currentPlayer` - In turn taking games, this is the current player allowed to interact with the game.

### Handling [gameMessages](#gameMessage)

The following gameMessage types need to be implemented by the game.  These gameMessages allow us to interact with the game in a consistent way between different games. Additional gameMessages can be required as necessary but must have the same message format (GameshellGameMessage).

#### Required gameMessages

| type | description |
| ---------------- | ----------------------------- |
| startGame | message to start gameplay |
| setTheme | message to set theme in game |
| setGameset | message to set the gameset |
| endGame | message to end game |
| setPlayers | message to set list of active players |
| setLocalPlayers | message to set local players who can be controlled by local computer |
| updateCurrentPlayer | update player whos turn it is |
| updatePlayerControls | updates whether controls for given player are enabled/disabled |
| showLabels | Show the card labels on each card. This is a "cheat mode" that should only show the cards for a therapist. |
| pauseGame | message to pauseGame |
| playersOnline | message to give list of personIds that recently came "online" for give game instance|
| playersOffline | message to give list of personIds that recently came "offline" for give game instance|
| setGameState | setting the gamestate. When this is sent it should set the game state of the local game to match what is sent. |

