import * as log from 'loglevel';
import {COMMAND_STATUS} from './constants';
import moderator from './moderator';
import {nightPhaseMessage} from './moderator-private-messages';
import {ROLES_TABLE} from './roles';
import {
  fisherYatesShuffle,
  getUserFromId,
  logReprChannel,
  logReprUser,
} from './util';

class Game {
  constructor(message, gameId, client, playerIds, roleKeys, ruleset) {
    // The ID of the game
    this.id = gameId;

    // The bot client
    this.client = client;

    // The Discord channel for this lobby
    this.channel = message.channel;

    // (Randomized) array of player's unique IDs (as strings)
    this.players = fisherYatesShuffle(playerIds);

    // The leader's player ID
    this.leaderIdx = 0;
    this.leader = null;
    this.setLeader();

    // Ruleset
    this.ruleset = ruleset;

    // Assign roles. rolePlayersTable has role keys as keys and arrays
    // of corresponding user IDs (strings) as values. playerRoleTable
    // has user IDs (strings) as keys and corresponding role keys as
    // values.
    this.rolePlayersTable = {};
    this.playerRoleTable = {};
    this.assignRoles(roleKeys);

    // Perform the night phase
    this.nightPhase();
  }

  handleCommand(message, command) {
    if (command[0] === COMMAND_STATUS) {
      // Inform the player about the status of the lobby
      moderator.gameStatus(message, this);
    }
  }

  isRoleInGame(roleKey) {
    return Object.keys(this.rolePlayersTable).includes(roleKey);
  }

  findPlayersOnTeam(team, excludedRoleKeys = [], shuffle = true) {
    let selectedRoleKeys = Object.keys(this.rolePlayersTable)
      .filter(roleKey => ROLES_TABLE[roleKey].team === team)
      .filter(roleKey => !excludedRoleKeys.includes(roleKey));

    let matchingPlayerIds = selectedRoleKeys.reduce(
      (accumArray, roleKey) =>
        accumArray.concat(this.rolePlayersTable[roleKey]),
      []
    );

    if (shuffle) {
      return fisherYatesShuffle(matchingPlayerIds);
    }

    return matchingPlayerIds;
  }

  assignRoles(roleKeys) {
    // Setup the role-players table
    let uniqueRoleKeys = [...new Set(roleKeys)];

    uniqueRoleKeys.map(key => {
      this.rolePlayersTable[key] = [];
    });

    // Assign players to their roles
    let shuffledRoleKeys = fisherYatesShuffle(roleKeys);

    shuffledRoleKeys.map(async (key, idx) => {
      let playerId = this.players[idx];

      this.rolePlayersTable[key].push(playerId);
      this.playerRoleTable[playerId] = key;

      let player = await getUserFromId(this.client, playerId);
      let verboseRole = ROLES_TABLE[key].name;

      log.debug(
        `assigning ${verboseRole} to ${logReprUser(player)} ` +
          `in ${logReprChannel(this.channel)}`
      );
    });
  }

  nightPhase() {
    // Message each user their assigned role
    this.players.map(playerId => nightPhaseMessage(playerId, this));
  }

  async setLeader() {
    this.leader = this.players[this.leaderIdx];

    let leaderUser = await getUserFromId(this.client, this.leader);

    log.debug(
      `setting ${logReprUser(leaderUser)} to leader ` +
        `in ${logReprChannel(this.channel)}`
    );
  }
}

export default Game;
