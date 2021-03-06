import {
  AVALONBOT_WEBSITE,
  AVALON_RULEBOOK_URL,
  COMMAND_ABOUT,
  COMMAND_CHANNEL_DEINIT,
  COMMAND_CHANNEL_INIT,
  COMMAND_GAME_ASSASSINATE,
  COMMAND_GAME_DM_APPROVE,
  COMMAND_GAME_DM_FAIL,
  COMMAND_GAME_DM_REJECT,
  COMMAND_GAME_DM_SUCCESS,
  COMMAND_GAME_LOBBY_CLAIM_ADMIN,
  COMMAND_GAME_LOBBY_CREATE,
  COMMAND_GAME_LOBBY_JOIN,
  COMMAND_GAME_LOBBY_KICK,
  COMMAND_GAME_LOBBY_LEAVE,
  COMMAND_GAME_LOBBY_START,
  COMMAND_GAME_LOBBY_STOP,
  COMMAND_GAME_LOBBY_TRANSFER_ADMIN,
  COMMAND_GAME_PINGALL,
  COMMAND_GAME_PINGIDLE,
  COMMAND_GAME_SETUP_CHOOSE,
  COMMAND_GAME_SETUP_CONFIRM,
  COMMAND_GAME_SETUP_RESET,
  COMMAND_GAME_SETUP_STOP,
  COMMAND_GAME_STOP,
  COMMAND_GAME_TEAM,
  COMMAND_HELP,
  COMMAND_HELP_ROLES,
  COMMAND_PREFIX,
  COMMAND_RULES,
  COMMAND_STATUS,
  COMMAND_WEBSITE,
  GAME_RULESET_AVALON,
  GAME_RULESET_AVALON_OPTION_NUM,
  GAME_SETTINGS_MAX_AVALON_PLAYERS,
  GAME_SETTINGS_MIN_AVALON_PLAYERS,
  ROLE_COMPLEXITY_ADVANCED,
  ROLE_COMPLEXITY_BASIC,
  STATE_GAME_ACCEPTING_MISSION_RESULTS,
  STATE_GAME_ASSASSINATION,
  STATE_GAME_CHOOSING_TEAM,
  STATE_GAME_VOTING_ON_TEAM,
  TEAM_RESISTANCE,
  TEAM_SPIES,
  TENSE_PRESENT,
  VICTORY_RESISTANCE_THREE_SUCCESSFUL_MISSIONS,
  VICTORY_SPIES_ASSASSINATION_SUCCESSFUL,
  VICTORY_SPIES_FIVE_FAILED_VOTES,
  VICTORY_SPIES_PROPERTY_MANAGER_NOT_FAILED,
  VICTORY_SPIES_THREE_FAILED_MISSIONS,
} from './constants';
import {GAME_BOARDS_TABLE} from './game-boards';
import {ROLE_KEY_ASSASSIN, ROLES_TABLE} from './roles';
import {
  gameBoardRepresentNoData,
  gameBoardRepresentWithData,
  getGuildMemberFromUserId,
  getPlayerRolesList,
  mapPlayerIdsToPlayersList,
  mapUsersToMentions,
} from './util';

// Help
const help = (message, pingAllEnabled) =>
  message.channel.send(
    '**Commands**\n\n' +
      `\`${COMMAND_PREFIX + COMMAND_HELP}\`` +
      ' - display this message\n' +
      `\`${COMMAND_PREFIX + COMMAND_HELP_ROLES}\`` +
      ' - display all roles\n' +
      `\`${COMMAND_PREFIX + COMMAND_RULES}\`` +
      ' - link the official "The Resistance: Avalon" rulebook\n' +
      `\`${COMMAND_PREFIX + COMMAND_STATUS}\`` +
      ' - show game status\n' +
      `\`${COMMAND_PREFIX + COMMAND_CHANNEL_INIT}\`` +
      ' - initialize AvalonBot in a channel\n' +
      `\`${COMMAND_PREFIX + COMMAND_CHANNEL_DEINIT}\`` +
      ' - remove AvalonBot from a channel\n' +
      `\`${COMMAND_PREFIX + COMMAND_ABOUT}\`` +
      ' - learn about AvalonBot\n' +
      `\`${COMMAND_PREFIX + COMMAND_WEBSITE}\`` +
      " - link AvalonBot's source code\n" +
      '\n**Game lobby commands**\n\n' +
      `\`${COMMAND_PREFIX + COMMAND_GAME_LOBBY_CREATE}\`` +
      ' - create game lobby\n' +
      `\`${COMMAND_PREFIX + COMMAND_GAME_LOBBY_JOIN}\`` +
      ' - join game lobby\n' +
      `\`${COMMAND_PREFIX + COMMAND_GAME_LOBBY_LEAVE}\`` +
      ' - leave game lobby\n' +
      `\`${COMMAND_PREFIX + COMMAND_GAME_LOBBY_STOP}\`` +
      ' - stop game lobby\n' +
      `\`${COMMAND_PREFIX + COMMAND_GAME_LOBBY_CLAIM_ADMIN}\`` +
      ' - show lobby admin or claim lobby admin (if available)\n' +
      `\`${COMMAND_PREFIX + COMMAND_GAME_LOBBY_START}\`` +
      ' - start game (if admin)\n' +
      `\`${COMMAND_PREFIX + COMMAND_GAME_LOBBY_KICK} @user1 @user2 ...\`` +
      ' - kick users from lobby (if admin)\n' +
      `\`${COMMAND_PREFIX + COMMAND_GAME_LOBBY_TRANSFER_ADMIN} @user\`` +
      ' - transfer admin to another user (if admin)\n' +
      '\n**Game setup commands**\n\n' +
      `\`${COMMAND_PREFIX + COMMAND_GAME_SETUP_STOP}\`` +
      ' - stop game setup\n' +
      `\`${COMMAND_PREFIX + COMMAND_GAME_SETUP_CHOOSE} opt1 opt2 ...\`` +
      ' - choose game setup options (if admin) \n' +
      `\`${COMMAND_PREFIX + COMMAND_GAME_SETUP_CONFIRM}\`` +
      ' - confirm game setup options (if admin) \n' +
      `\`${COMMAND_PREFIX + COMMAND_GAME_SETUP_RESET}\`` +
      ' - reset game setup (if admin)\n' +
      '\n**Game commands**\n\n' +
      `\`${COMMAND_PREFIX + COMMAND_GAME_STOP}\`` +
      ' - stop game\n' +
      (pingAllEnabled
        ? `\`${COMMAND_PREFIX + COMMAND_GAME_PINGALL}\`` +
          ' - have bot mention all other players \n'
        : '') +
      `\`${COMMAND_PREFIX + COMMAND_GAME_PINGIDLE}\`` +
      ' - have bot mention all players which need to perform an action\n' +
      `\`${COMMAND_PREFIX + COMMAND_GAME_TEAM} @user1 @user2 ...\`` +
      ' - choose players for mission team (if leader)\n' +
      `\`${COMMAND_PREFIX + COMMAND_GAME_ASSASSINATE} @user ...\`` +
      ' - choose player to assassinate (if assassin)\n'
  );

// Roles help
const roleHelp = message => {
  const formatRole = role => {
    let roleStr = `**${role.emojiName}**\n→ ${role.description}\n`;

    // If role has a strategy, show it
    if (role.strategy === null) return roleStr;

    return roleStr + `→ ${role.strategy}\n`;
  };

  // Send two messages so that the character limit is not exceeded
  message.channel.send(
    `__**Team ${TEAM_RESISTANCE} roles (basic)**__\n\n` +
      Object.values(ROLES_TABLE)
        .filter(
          role =>
            role.team === TEAM_RESISTANCE &&
            role.complexity === ROLE_COMPLEXITY_BASIC
        )
        .map(formatRole)
        .join('\n') +
      '\n' +
      `__**Team ${TEAM_SPIES} roles (basic)**__\n\n` +
      Object.values(ROLES_TABLE)
        .filter(
          role =>
            role.team === TEAM_SPIES &&
            role.complexity === ROLE_COMPLEXITY_BASIC
        )
        .map(formatRole)
        .join('\n')
  );

  // Start this messages with the Unicode ZERO WIDTH SPACE character and
  // a new line. This is (the only?) way to have leading whitespace so
  // that, in this case, this message lines up nicely with the previous
  // one.
  message.channel.send(
    '\u200B' +
      '\n' +
      `__**Team ${TEAM_RESISTANCE} roles (advanced)**__\n\n` +
      Object.values(ROLES_TABLE)
        .filter(
          role =>
            role.team === TEAM_RESISTANCE &&
            role.complexity === ROLE_COMPLEXITY_ADVANCED
        )
        .map(formatRole)
        .join('\n') +
      '\n' +
      `__**Team ${TEAM_SPIES} roles (advanced)**__\n\n` +
      Object.values(ROLES_TABLE)
        .filter(
          role =>
            role.team === TEAM_SPIES &&
            role.complexity === ROLE_COMPLEXITY_ADVANCED
        )
        .map(formatRole)
        .join('\n')
  );
};
// Rules
const rules = message =>
  message.channel.send(
    `Linked is the official "The Resistance: Avalon" rulebook: ${AVALON_RULEBOOK_URL}`
  );

// About
const about = message =>
  message.channel.send(
    'AvalonBot is a Discord bot which moderates ' +
      '"The Resistance" and "The Resistance: Avalon" games. ' +
      'The base rulesets for both games are supported, as well as ' +
      'the optional "targeting" rule (soon™); several home-made roles ' +
      'are also included (soon™).\n\n' +
      'AvalonBot is maintained by ' +
      'Cameron Hu (@hagabooga) and Matt Wiens (@mwiens91) ' +
      'and is licensed under the GNU General Public License v3.0.'
  );

// Website
const website = message => message.channel.send(AVALONBOT_WEBSITE);

// Channel initialization
const channelInit = message =>
  message.channel.send(
    `AvalonBot initialized in <#${message.channel.id}>! ` +
      'To start a game lobby type ' +
      `\`${COMMAND_PREFIX + COMMAND_GAME_LOBBY_CREATE}\`. ` +
      `Type \`${COMMAND_PREFIX + COMMAND_HELP}\` for help.`
  );

// Channel deinitialization
const channelDeinit = message =>
  message.channel.send(`AvalonBot deinitialized in <#${message.channel.id}>.`);

// Channel status (when neither game lobby nor game are active)
const channelStatus = message =>
  message.channel.send(
    'There is no active game. Type ' +
      `\`${COMMAND_PREFIX + COMMAND_GAME_LOBBY_CREATE}\` to start one!`
  );

// Lobby creation
const lobbyCreate = message =>
  message.channel.send(
    `**${message.member.displayName}** has started a game lobby! ` +
      `Type \`${COMMAND_PREFIX + COMMAND_GAME_LOBBY_JOIN}\` to join.`
  );

// Lobby join
const lobbyJoin = message =>
  message.channel.send(
    `**${message.member.displayName}** has joined the game!`
  );

// Attempted lobby join but already joined
const lobbyJoinAlreadyJoined = message =>
  message.channel.send(`<@${message.author.id}>, you are already in the game!`);

// Lobby force join
const lobbyForceJoin = (message, users) => {
  message.channel.send(
    `${mapUsersToMentions(users, ', ')}, you have been forced to join ` +
      `the game lobby by **${message.member.displayName}**!`
  );
};

// Lobby claim admin
const lobbyClaimAdmin = message =>
  message.channel.send(
    `**${message.member.displayName}** is now the game lobby admin!`
  );

// Attempted admin claim but there's already an admin
const lobbyClaimAdminFailed = async (message, discordClient, adminId) => {
  let adminGuildMember = await getGuildMemberFromUserId(
    discordClient,
    message.guild,
    adminId
  );

  message.channel.send(
    `**${adminGuildMember.displayName}** is the lobby admin.`
  );
};

// Lobby admin transfer
const lobbyTransferAdmin = async (message, discordClient, newAdminId) => {
  let newAdminGuildMember = await getGuildMemberFromUserId(
    discordClient,
    message.guild,
    newAdminId
  );

  message.channel.send(
    `**${newAdminGuildMember.displayName}** is now the game lobby admin!`
  );
};

// Attempted admin transfer but mentioned too many users
const lobbyTransferAdminTooManyMentions = message =>
  message.channel.send(
    `You must select exactly one player to transfer admin to!`
  );

// Attempted admin transfer but user not in game
const lobbyTransferAdminUserNotInGame = async (
  message,
  discordClient,
  userId
) => {
  let userGuildMember = await getGuildMemberFromUserId(
    discordClient,
    message.guild,
    userId
  );

  message.channel.send(
    `**${userGuildMember.displayName}** is not in the game lobby!`
  );
};

// Lobby leave
const lobbyLeave = message =>
  message.channel.send(`**${message.member.displayName}** has left the game.`);

// Lobby stop
const lobbyStop = message =>
  message.channel.send(
    'The game lobby has been stopped! Type ' +
      `\`${COMMAND_PREFIX + COMMAND_GAME_LOBBY_CREATE}\` to start a new one.`
  );

// Lobby start attempted but not enough players
const lobbyStartNotEnoughPlayers = message =>
  message.channel.send(
    'Must have at least ' +
      `**${GAME_SETTINGS_MIN_AVALON_PLAYERS} players** to start the game!`
  );

// Lobby start attempted but too many players
const lobbyStartTooManyPlayers = message =>
  message.channel.send(
    'Must have at most ' +
      `**${GAME_SETTINGS_MAX_AVALON_PLAYERS} players** to start the game!`
  );

// Lobby kick
const lobbyKick = (message, users) =>
  message.channel.send(
    `${mapUsersToMentions(users, ', ')}, you have been kicked from the game ` +
      `lobby by **${message.member.displayName}**!`
  );

// Lobby status
const lobbyStatus = async (message, gameLobby) => {
  // Build up a message to send and then send it
  let messageToSend = '';

  // The first bit of the message shows the channel state
  messageToSend +=
    'A game lobby is currently accepting players. Type ' +
    `\`${COMMAND_PREFIX + COMMAND_GAME_LOBBY_JOIN}\` to join!\n\n`;

  // List the players that have joined
  let playerListString = await mapPlayerIdsToPlayersList(
    message.guild,
    gameLobby.client,
    gameLobby.players,
    gameLobby.admin,
    ', '
  );

  if (gameLobby.players.length === 0) {
    messageToSend += '**Joined players**: no joined players';
  } else {
    messageToSend += `**Joined players**: ${playerListString}`;
  }

  // List requirements for starting game
  messageToSend += '\n\n';

  if (gameLobby.players.length < GAME_SETTINGS_MIN_AVALON_PLAYERS) {
    messageToSend +=
      `At least **${GAME_SETTINGS_MIN_AVALON_PLAYERS}** players ` +
      'are needed to start the game.';
  } else if (gameLobby.players.length > GAME_SETTINGS_MAX_AVALON_PLAYERS) {
    messageToSend +=
      'Too many players! ' +
      `There can be at most **${GAME_SETTINGS_MAX_AVALON_PLAYERS}** players.`;
  } else {
    if (gameLobby.admin !== null) {
      messageToSend +=
        `<@${gameLobby.admin}>, type ` +
        `\`${COMMAND_PREFIX + COMMAND_GAME_LOBBY_START}\` to start the game!`;
    } else {
      messageToSend +=
        'An admin can now start the game! ' +
        `Type \`${COMMAND_PREFIX + COMMAND_GAME_LOBBY_CLAIM_ADMIN}\` ` +
        'to claim admin and then type ' +
        `\`${COMMAND_PREFIX + COMMAND_GAME_LOBBY_START}\` to start the game.`;
    }
  }

  //Send the message
  message.channel.send(messageToSend);
};

// Game setup introduction
const gameSetupIntroduction = (message, adminId) =>
  message.channel.send(`Game setup has started! <@${adminId}>, you're up!`);

// Game setup choose ruleset
const gameSetupChooseRuleset = (message, adminId) =>
  message.channel.send(
    'Please select the game ruleset:\n\n' +
      `**[${GAME_RULESET_AVALON_OPTION_NUM}]** ${GAME_RULESET_AVALON}\n` +
      `\n<@${adminId}>, type ` +
      `\`${COMMAND_PREFIX + COMMAND_GAME_SETUP_CHOOSE}\` ` +
      'followed by the option number you would like to select.'
  );

// Game setup choose ruleset echo
const gameSetupChooseRulesetConfirmation = (message, ruleset) =>
  message.channel.send(`**${ruleset}** ruleset selected.`);

// Game setup choose roles
const gameSetupChooseRoles = (message, adminId, numPlayers) => {
  let rolesString = Object.entries(ROLES_TABLE)
    .map(([key, role]) => `**[${key}]** ${role.emojiName}`)
    .join('\n');
  let numResistanceRoles = GAME_BOARDS_TABLE[numPlayers].numResistance;
  let numSpiesRoles = GAME_BOARDS_TABLE[numPlayers].numSpies;

  message.channel.send(
    `Please select **${numResistanceRoles} Resistance roles** and ` +
      `**${numSpiesRoles} Spies roles** from the following roles:\n\n${rolesString}` +
      `\n\n<@${adminId}>, type ` +
      `\`${COMMAND_PREFIX + COMMAND_GAME_SETUP_CHOOSE}\` ` +
      'followed by the role keys of the roles you would like to select. ' +
      'You may select the same role multiple times. ' +
      `Type \`${COMMAND_PREFIX + COMMAND_HELP_ROLES}\` ` +
      'to list available roles.'
  );
};

// Game setup choose roles errors
const gameSetupChooseRolesErrors = (message, errors) =>
  message.channel.send(
    '**Invalid role selection**\n\nThe following errors occured:\n' +
      errors.map(error => '→ ' + error).join('\n')
  );

// Game setup confirm setup
const gameSetupConfirm = (message, gameSetup) =>
  message.channel.send(
    `<@${gameSetup.admin}>, please confirm the chosen game setup:\n\n` +
      `**Ruleset**: ${gameSetup.ruleset}\n` +
      `**Roles**: ${gameSetup.roles
        .map(roleKey => ROLES_TABLE[roleKey].emojiName)
        .join(', ')}` +
      '\n\n' +
      `Type \`${COMMAND_PREFIX + COMMAND_GAME_SETUP_CONFIRM}\` ` +
      'to start the game or type ' +
      `\`${COMMAND_PREFIX + COMMAND_GAME_SETUP_RESET}\` to pick a new setup.`
  );

// Game setup stop
const gameSetupStop = message =>
  message.channel.send(
    'Game setup has been stopped! Type ' +
      `\`${COMMAND_PREFIX + COMMAND_GAME_LOBBY_CREATE}\` ` +
      'to start a new game lobby.'
  );

// Game setup status
const gameSetupStatus = async (message, gameSetup) => {
  // Build up a message to send and then send it
  let messageToSend = '';

  // Introductory message
  let adminGuildMember = await getGuildMemberFromUserId(
    gameSetup.client,
    message.guild,
    gameSetup.admin
  );

  messageToSend +=
    `Hang tight, **${adminGuildMember.displayName}** is currently ` +
    'setting up the game.\n\n';

  // List the players
  let playerListString = await mapPlayerIdsToPlayersList(
    message.guild,
    gameSetup.client,
    gameSetup.players,
    gameSetup.admin,
    ', '
  );

  messageToSend += `**Players**: ${playerListString}\n`;

  // List the ruleset
  if (gameSetup.ruleset === null) {
    messageToSend += '**Ruleset**: not yet selected\n';
  } else {
    messageToSend += `**Ruleset**: ${gameSetup.ruleset}\n`;
  }

  // List the roles chosen
  if (gameSetup.roles.length === 0) {
    messageToSend += '**Roles**: not yet selected\n';
  } else {
    messageToSend += `**Roles**: ${gameSetup.roles
      .map(roleKey => ROLES_TABLE[roleKey].emojiName)
      .join(', ')}\n`;
  }

  // Show game board
  messageToSend +=
    '**Game board**:\n' +
    '```' +
    gameBoardRepresentNoData(gameSetup.players.length) +
    '```';

  //Send the message
  message.channel.send(messageToSend);
};

// Game status
const gameStatus = async (message, game) => {
  // Build up a message to send and then send it
  let messageToSend = '';

  if (game.state === STATE_GAME_CHOOSING_TEAM) {
    let leaderGuildMember = await getGuildMemberFromUserId(
      game.client,
      message.guild,
      game.leader
    );

    messageToSend +=
      `**${leaderGuildMember.displayName}** is currently` +
      ' selecting the mission team.\n\n';
  } else if (game.state === STATE_GAME_VOTING_ON_TEAM) {
    messageToSend +=
      'Accepting votes for proposed team.' +
      " If you haven't yet voted, direct message me either of the following:\n\n" +
      `→ \`${COMMAND_PREFIX + COMMAND_GAME_DM_APPROVE} ${game.id}\`` +
      ' to approve the team.\n' +
      `→ \`${COMMAND_PREFIX + COMMAND_GAME_DM_REJECT} ${game.id}\`` +
      ' to reject the team.\n\n';
  } else if (game.state === STATE_GAME_ACCEPTING_MISSION_RESULTS) {
    messageToSend +=
      ' Accepting mission outcomes from team members.' +
      " If you haven't yet completed the mission," +
      ' direct message me either of the following:\n\n' +
      `→ \`${COMMAND_PREFIX + COMMAND_GAME_DM_SUCCESS} ${game.id}\`` +
      ' to succeed the mission.\n' +
      `→ \`${COMMAND_PREFIX + COMMAND_GAME_DM_FAIL} ${game.id}\`` +
      ' to fail the mission.\n\n';
  } else if (game.state === STATE_GAME_ASSASSINATION) {
    let assassinGuildMember = await getGuildMemberFromUserId(
      game.client,
      game.guild,
      game.findPlayersWithRoles([ROLE_KEY_ASSASSIN], false)[0]
    );

    messageToSend +=
      `**${assassinGuildMember.displayName}** is currently` +
      ' selecting a player to assassinate.\n\n';
  }

  // List the players
  let playerListString = await mapPlayerIdsToPlayersList(
    message.guild,
    game.client,
    game.players,
    game.leader,
    ', '
  );

  messageToSend += `**Players**: ${playerListString}\n`;

  // List the ruleset
  messageToSend += `**Ruleset**: ${game.ruleset}\n`;

  // List the roles chosen
  messageToSend += `**Roles**: ${game.roles
    .map(roleKey => ROLES_TABLE[roleKey].emojiName)
    .join(', ')}\n`;

  // List the current team members
  if (game.state === STATE_GAME_ASSASSINATION) {
    // Don't show current team if in assassination phase
  } else if (game.team.length === 0) {
    messageToSend += '**Current team**: not yet selected\n';
  } else {
    let currentTeamListString = await mapPlayerIdsToPlayersList(
      message.guild,
      game.client,
      game.team,
      game.leader,
      ', '
    );
    messageToSend += `**Current team**: ${currentTeamListString}\n`;
  }

  // Show game board
  messageToSend +=
    '**Game board**:\n' +
    '```' +
    gameBoardRepresentWithData(game) +
    '```' +
    `\n**${5 - game.numRejects}** team votes left before spies win!`;

  //Send the message
  message.channel.send(messageToSend);
};

// Game stop
const gameStop = message =>
  message.channel.send(
    'Game has been stopped! Type ' +
      `\`${COMMAND_PREFIX + COMMAND_GAME_LOBBY_CREATE}\` ` +
      'to start a new game lobby.'
  );

// Game ping all other players
const gamePingAllOthers = (message, game) =>
  message.channel.send(
    game.players
      .filter(id => id !== message.author.id)
      .map(id => `<@${id}>`)
      .join(' ')
  );

// Game ping leader
const gamePingLeader = (message, game) =>
  message.channel.send(`<@${game.leader}>`);

// Game ping not voted
const gamePingNotVoted = (message, game) =>
  message.channel.send(
    game
      .findPlayersNotYetVoted()
      .map(id => `<@${id}>`)
      .join(' ')
  );

// Game ping not done mission
const gamePingNotDoneMission = (message, game) =>
  message.channel.send(
    game
      .findPlayersNotYetDoneMission()
      .map(id => `<@${id}>`)
      .join(' ')
  );

// Game ping assassin
const gamePingAssassin = (message, game) => {
  let assassinId = game.findPlayersWithRoles([ROLE_KEY_ASSASSIN], false)[0];

  message.channel.send(`<@${assassinId}>`);
};

// Game choose team - prompt leader
const gameMissionChoose = (channel, numOnMission, leaderId) =>
  channel.send(
    `<@${leaderId}>, you're now the leader!` +
      ` Type \`${COMMAND_PREFIX + COMMAND_GAME_TEAM}\`` +
      ` followed by ${numOnMission}` +
      ' players you want on the mission team.'
  );

// Game choose team - leader selected not right amount of players
const gameMissionChooseIncorrectNumberOfPlayers = (
  message,
  numOnMission,
  leaderId
) =>
  message.channel.send(
    `<@${leaderId}>, please select exactly ${numOnMission}` +
      ' players to be on the mission team.'
  );

// Game choose team - instructions
const gameVoteOnTeam = (message, game) =>
  message.channel.send(
    'Everyone, direct message me either of the following:\n\n' +
      `→ \`${COMMAND_PREFIX + COMMAND_GAME_DM_APPROVE} ${game.id}\`` +
      ' to approve the team.\n' +
      `→ \`${COMMAND_PREFIX + COMMAND_GAME_DM_REJECT} ${game.id}\`` +
      ' to reject the team.'
  );

// Game choose team - player just voted
const gameVoteOnTeamNewVote = async (message, mainChannel, guild, game) => {
  let messageToSend = '';

  let voterGuildMember = await getGuildMemberFromUserId(
    game.client,
    guild,
    message.author.id
  );
  let numNotYetVoted = game.findPlayersNotYetVoted().length;

  messageToSend += `**${voterGuildMember.displayName}** has voted!`;

  if (numNotYetVoted > 1) {
    messageToSend += ` **${numNotYetVoted}** votes still need to be cast!`;
  } else if (numNotYetVoted === 1) {
    messageToSend += ` **${numNotYetVoted}** vote still needs to be cast!`;
  }

  mainChannel.send(messageToSend);
};

// Game choose team - voting finished
const gameVoteOnTeamVotingFinished = async (
  hasPassed,
  channel,
  guild,
  game
) => {
  let messageToSend = '';

  // List individual votes
  messageToSend += '**Voting results**:\n\n';

  let promises = game.players.map(async id => {
    // Get player guild member
    let playerGuildMember = await getGuildMemberFromUserId(
      game.client,
      guild,
      id
    );

    // Get the player's vote
    let playerVote = game.teamVotes[id];

    messageToSend += `→ **${playerGuildMember.displayName}** voted **${playerVote}**.\n`;
  });

  await Promise.all(promises);

  // List the result
  if (hasPassed) {
    messageToSend += '\nThe team has been **approved**!';
  } else {
    messageToSend +=
      '\nThe team has been **rejected**.' +
      ' The next leader will propose a new team.';
  }

  channel.send(messageToSend);
};

// Game mission phase introduction
const gameMissionPhaseIntro = (channel, game) =>
  channel.send(
    game.team.map(id => `<@${id}>`).join(', ') +
      ', direct message me either of the following:\n\n' +
      `→ \`${COMMAND_PREFIX + COMMAND_GAME_DM_SUCCESS} ${game.id}\`` +
      ' to succeed the mission.\n' +
      `→ \`${COMMAND_PREFIX + COMMAND_GAME_DM_FAIL} ${game.id}\`` +
      ' to fail the mission.'
  );

// Game mission phase - player just submitted outcome
const gameMissionPhaseNewOutcome = async (
  message,
  mainChannel,
  guild,
  game
) => {
  let messageToSend = '';

  let playerGuildMember = await getGuildMemberFromUserId(
    game.client,
    guild,
    message.author.id
  );
  let numNotYetDoneMission = game.findPlayersNotYetDoneMission().length;

  messageToSend += `**${playerGuildMember.displayName}** has completed the mission!`;

  if (numNotYetDoneMission > 1) {
    messageToSend +=
      ` **${numNotYetDoneMission}**` +
      ' team members still need to complete the mission!';
  } else if (numNotYetDoneMission === 1) {
    messageToSend += ` **1** team member still needs to complete the mission!`;
  }

  mainChannel.send(messageToSend);
};

// Game mission phase - mission finished
const gameMissionPhaseFinished = (hasSucceeded, channel, game) => {
  let numFails = game.findNumFailsOnMission();

  let outcomeStr = hasSucceeded ? 'succeeded' : 'failed';

  let messageToSend = '';

  // State the final outcome
  messageToSend += `The mission has **${outcomeStr}**!`;

  if (numFails === 1) {
    messageToSend += ` **1** player failed the mission.\n`;
  } else {
    messageToSend += ` **${numFails}** players failed the mission.\n`;
  }

  channel.send(messageToSend);
};

// Game assassination phase introduction
const gameAssassinationPhaseIntro = async (channel, game) => {
  let assassinId = game.findPlayersWithRoles([ROLE_KEY_ASSASSIN], false)[0];

  let spiesRoleList = await getPlayerRolesList(game, TEAM_SPIES, TENSE_PRESENT);

  channel.send(
    'Resistance has almost won!' +
      ` <@${assassinId}>, please select a player to assassinate.` +
      ` Type \`${COMMAND_PREFIX + COMMAND_GAME_ASSASSINATE}\`` +
      ' followed by the player you wish to assassinate.\n\n' +
      'The spies reveal their identities:\n\n' +
      spiesRoleList
  );
};

// Game assassination - attempted assassination but mentioned wrong
// number of joined players
const gameAssassinationPhaseWrongPlayerNumber = message =>
  message.channel.send(`You must select exactly 1 player to assassinate!`);

// Game over message
const gameGameOver = async (gameOutcome, channel, game) => {
  let messageToSend = '';

  if (
    [
      VICTORY_SPIES_FIVE_FAILED_VOTES,
      VICTORY_SPIES_THREE_FAILED_MISSIONS,
      VICTORY_SPIES_ASSASSINATION_SUCCESSFUL,
      VICTORY_SPIES_PROPERTY_MANAGER_NOT_FAILED,
    ].includes(gameOutcome)
  ) {
    if (gameOutcome === VICTORY_SPIES_FIVE_FAILED_VOTES) {
      messageToSend += 'Five consecutive team selections have failed.';
    } else if (gameOutcome === VICTORY_SPIES_THREE_FAILED_MISSIONS) {
      messageToSend += 'Three missions have failed.';
    } else if (gameOutcome === VICTORY_SPIES_PROPERTY_MANAGER_NOT_FAILED) {
      let propertyManagersNotFailedGuildMemberPromises = Object.keys(
        game.propertyManagerHasFailedMap
      )
        .filter(id => !game.propertyManagerHasFailedMap[id])
        .map(
          async id =>
            await getGuildMemberFromUserId(game.client, game.guild, id)
        );
      let propertyManagersNotFailedGuildMembers = await Promise.all(
        propertyManagersNotFailedGuildMemberPromises
      );

      if (propertyManagersNotFailedGuildMembers.length === 1) {
        messageToSend +=
          propertyManagersNotFailedGuildMembers
            .map(gm => `**${gm.displayName}**`)
            .join(',') +
          ' was a Property Manager but failed to sabotage a mission';
      } else {
        messageToSend +=
          propertyManagersNotFailedGuildMembers
            .map(gm => `**${gm.displayName}**`)
            .join(',') +
          ' were Property Managers but failed to sabotage a mission';
      }
    } else {
      messageToSend += 'Merlin was assassinated.';
    }

    messageToSend += ' **Spies win**!\n\n';

    let spiesStr = game
      .findPlayersOnTeam(TEAM_SPIES)
      .map(id => `<@${id}>`)
      .join(', ');

    messageToSend += `Congratulations ${spiesStr}!\n\n`;
  } else {
    if (gameOutcome === VICTORY_RESISTANCE_THREE_SUCCESSFUL_MISSIONS) {
      messageToSend += 'Three missions have succeeded.';
    } else {
      messageToSend += 'Merlin avoided assassination!';
    }

    messageToSend += ' **Resistance wins**!\n\n';

    let resistanceStr = game
      .findPlayersOnTeam(TEAM_RESISTANCE)
      .map(id => `<@${id}>`)
      .join(', ');

    messageToSend += `Congratulations ${resistanceStr}!\n\n`;
  }

  let playerRoleList = await getPlayerRolesList(game);
  messageToSend += playerRoleList;

  channel.send(messageToSend);
};

export default {
  help,
  roleHelp,
  rules,
  about,
  website,
  channelInit,
  channelDeinit,
  channelStatus,
  lobbyCreate,
  lobbyJoin,
  lobbyJoinAlreadyJoined,
  lobbyForceJoin,
  lobbyClaimAdmin,
  lobbyClaimAdminFailed,
  lobbyTransferAdmin,
  lobbyTransferAdminTooManyMentions,
  lobbyTransferAdminUserNotInGame,
  lobbyLeave,
  lobbyStop,
  lobbyStartNotEnoughPlayers,
  lobbyStartTooManyPlayers,
  lobbyKick,
  lobbyStatus,
  gameSetupIntroduction,
  gameSetupChooseRuleset,
  gameSetupChooseRulesetConfirmation,
  gameSetupChooseRoles,
  gameSetupChooseRolesErrors,
  gameSetupConfirm,
  gameSetupStop,
  gameSetupStatus,
  gameStatus,
  gameStop,
  gamePingAllOthers,
  gamePingLeader,
  gamePingNotVoted,
  gamePingNotDoneMission,
  gamePingAssassin,
  gameMissionChoose,
  gameMissionChooseIncorrectNumberOfPlayers,
  gameVoteOnTeam,
  gameVoteOnTeamNewVote,
  gameVoteOnTeamVotingFinished,
  gameMissionPhaseIntro,
  gameMissionPhaseNewOutcome,
  gameMissionPhaseFinished,
  gameAssassinationPhaseIntro,
  gameAssassinationPhaseWrongPlayerNumber,
  gameGameOver,
};
