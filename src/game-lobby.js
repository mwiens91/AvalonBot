import * as log from 'loglevel';
import {
  COMMAND_GAME_LOBBY_CLAIM_ADMIN,
  COMMAND_GAME_LOBBY_FORCE_JOIN,
  COMMAND_GAME_LOBBY_JOIN,
  COMMAND_GAME_LOBBY_KICK,
  COMMAND_GAME_LOBBY_LEAVE,
  COMMAND_GAME_LOBBY_STATUS,
  COMMAND_GAME_LOBBY_STOP,
  STATE_GAME_LOBBY_STOPPED,
} from './constants';
import moderator from './moderator';
import {logReprChannel, logReprUser} from './util';

class GameLobby {
  constructor(message, forceJoinEnabled) {
    // Game lobby state
    this.gameLobbyState = null;

    // Setting for whether to allow the force join command
    this.forceJoinEnabled = forceJoinEnabled;

    // Array of joined player's unique IDs (as strings)
    this.players = [];
    this.addPlayer(message.author, message.channel);

    // Lobby admin's unique ID (as string). Note that we set it to null
    // initially so that the setAdmin function isn't modifying a
    // variable that doesn't exist.
    this.lobbyAdminId = null;
    this.setAdmin(message.author, message.channel);
  }

  handleCommand(message, command) {
    if (command[0] === COMMAND_GAME_LOBBY_JOIN) {
      // Player wants to join the game. Check if player is already in
      // the game; if not, add them to the lobby
      if (this.playerIsInGame(message.author)) {
        moderator.lobbyAlreadyJoined(message);
      } else {
        this.addPlayer(message.author, message.channel);

        moderator.lobbyJoin(message);
      }
    } else if (command[0] === COMMAND_GAME_LOBBY_STATUS) {
      // Inform the player about the status of the lobby
      moderator.lobbyStatus(message, this);
    } else if (this.playerIsInGame(message.author)) {
      // Send to method handling commands for active players
      this.handleJoinedPlayerCommand(message, command);
    }
  }

  handleJoinedPlayerCommand(message, command) {
    if (command[0] === COMMAND_GAME_LOBBY_FORCE_JOIN) {
      // Force players to join the game
      let newPlayers = message.mentions.users.filter(
        user => !this.playerIsInGame(user)
      );

      // If all of the mentioned players are in the game, ignore the
      // command
      if (newPlayers.size === 0) {
        return;
      }

      // Add the players
      this.addPlayers(newPlayers, message.channel);

      moderator.lobbyForceJoin(message, newPlayers);
    } else if (command[0] === COMMAND_GAME_LOBBY_LEAVE) {
      // Remove the player from the game
      this.removePlayer(message.author, message.channel);

      moderator.lobbyLeave(message);
    } else if (command[0] === COMMAND_GAME_LOBBY_STOP) {
      // Set the game lobby state to stopped
      this.stopLobby(message.channel);

      moderator.lobbyStop(message);
    } else if (command[0] === COMMAND_GAME_LOBBY_CLAIM_ADMIN) {
      // User wants to claim admin. Let them if there's no admin,
      // otherwise send them a message saying there's already an admin.
      if (this.lobbyAdminId === null) {
        this.setAdmin(message.author, message.channel);

        moderator.lobbyClaimAdmin(message);
      } else {
        moderator.lobbyFailedClaimAdmin(message);
      }
    } else if (this.playerIsAdmin(message.author)) {
      // Send to method handling commands for the lobby admin
      this.handleAdminCommand(message, command);
    }
  }

  handleAdminCommand(message, command) {
    if (command[0] === COMMAND_GAME_LOBBY_KICK) {
      // Kick players from the game
      let joinedPlayersToKick = message.mentions.users.filter(user =>
        this.playerIsInGame(user)
      );

      // If none of the mentioned players are in the game, ignore the
      // command
      if (joinedPlayersToKick.size === 0) {
        return;
      }

      // Remove the players
      this.removePlayers(joinedPlayersToKick, message.channel);

      moderator.lobbyKick(message, joinedPlayersToKick);
    }
  }

  playerIsInGame(user) {
    return this.players.includes(user.id);
  }

  playerIsAdmin(user) {
    return this.lobbyAdminId === user.id;
  }

  addPlayer(user, channel) {
    log.debug(
      `adding ${logReprUser(user)} to game lobby in ${logReprChannel(channel)}`
    );

    this.players.push(user.id);
  }

  addPlayers(users, channel) {
    users.forEach(user => this.addPlayer(user, channel));
  }

  removePlayer(user, channel) {
    // Remove adminship if admin is removed
    if (this.lobbyAdminId === user.id) {
      this.unsetAdmin(user, channel);
    }

    log.debug(
      `removing ${logReprUser(user)} from game lobby in ${logReprChannel(
        channel
      )}`
    );

    // Remove the player
    this.players = this.players.filter(id => id !== user.id);
  }

  removePlayers(users, channel) {
    users.forEach(user => this.removePlayer(user, channel));
  }

  setAdmin(user, channel) {
    log.debug(
      `setting ${logReprUser(user)} as game lobby admin in ${logReprChannel(
        channel
      )}`
    );

    this.lobbyAdminId = user.id;
  }

  unsetAdmin(user, channel) {
    log.debug(
      `removing ${logReprUser(user)} as game lobby admin in ${logReprChannel(
        channel
      )}`
    );

    this.lobbyAdminId = null;
  }

  stopLobby(channel) {
    log.debug(
      `setting game lobby state to 'stopped' in ${logReprChannel(channel)}`
    );

    this.gameLobbyState = STATE_GAME_LOBBY_STOPPED;
  }
}

export default GameLobby;
