import * as log from 'loglevel';
import {COMMAND_GAME_LOBBY_JOIN, STATE_GAME_LOBBY_READY} from './constants';
import moderator from './moderator';
import {logReprChannel, logReprUser} from './util';

class GameLobby {
  constructor() {
    // Game lobby state
    this.gameLobbyState = null;

    // Array of joined player's unique IDs (as strings)
    this.players = [];
  }

  handleCommand(message, command) {
    if (command[0] === COMMAND_GAME_LOBBY_JOIN) {
      // Player wants to join the game. Check if player is already in
      // the game; if not, add them to the lobby
      if (this.players.includes(message.author.id)) {
        moderator.lobbyAlreadyJoined(message);
      } else {
        this.players.push(message.author.id);

        log.debug(
          `adding ${logReprUser(
            message.author
          )} to game lobby in ${logReprChannel(message.channel)}`
        );

        moderator.lobbyJoin(message);
      }
    }
  }
}

export default GameLobby;