// Include
const command = require('./commands.js');
const util = require('./utilities.js');
const ZM = require('./guild-master/zoneManager.js');
const MM = require('./guild-master/messageManager.js');
const RM = require('./guild-master/resourceManager.js');
const LM = require('./guild-master/leaderboardManager.js')
const database = require('./database.js');
const serverConfig = require('./settings/server-config.js');
const Player = require('./guild-master/models/player.js');
const attack = require('./commands/attack.js');
const debugMode = process.env.DEBUG_MODE === 'ON';

const levelResource = require('./commands/levelResource.js');
const levelDamage = require('./commands/levelDamage.js');
const levelCrit = require('./commands/levelCrit.js');

console.log(`DEBUG_MODE: ${typeof debugMode}`)

if (debugMode == undefined)
	throw "Please update your .env file to have a DEBUG_MODE variable"

if (debugMode){
	console.log('DEBUG MODE ENABLED, DAMAGE SCALING INCREASED AMONG OTHER DANGEROUS THINGS')
}

// Variables
let game_running = true;
let lastSync = new Date();
let lastSave = new Date();
let lastLeaderboard = new Date();
let leaderboardChannel;
let zoneChannel;
let guild;
let firstfirst = true;

// Public Functions

/**
 * Oh shit wadup, one of your members updated dawgy boi
 */
function memberUpdate(oldMember, newMember) {
	let member = newMember;
	// Is this guild member anybody we care about? (IE a player?)
	if(util.isGameUser(member) !== true) {
		return;
	}

	let classRole = util.getMemberClassRole(member);
	let player = database.getPlayer(member.id);
	if(classRole !== player.class) {
		util.consoleMsg(`${member.nickname} changed their class to ${classRole}`);
		if(classRole != null) {
			if(member.nickname == null) {
				player.name = member.user.username;
			}
			else{
				player.name = member.nickname;
			}
			
			player.assignClass(classRole);
		}
	}
}


/**
 * Interpret new message
 *
 * @access				public
 *
 * @param {Object}		discord.js message
 */
function newMessage(msg) {
	// First Character Of Message
	var prefix = msg.content.charAt(0);

	// If Admin Command
	if(prefix == process.env.ADMIN_PREFIX) {
		// Console Log
		util.consoleMsg("Admin Prefix Sent");
		// Variables
		var correctChannel = true; // Currently assuming Admin do shit anywhere
		var correctRole = util.isAdmin(msg.member);
		var commandStr = util.getCommand(msg, process.env.ADMIN_PREFIX);

		// If Correct Role
		if(correctRole) {
			util.consoleMsg("Admin Command Issued: " + commandStr);
			command.adminCommand(commandStr, msg);
		}
		// No admin role found
		else{
		// Console Log
		util.consoleMsg("User Not Admin, No Command Issued");
		}
	}

	if(util.isZoneChannel(msg) && msg.content != '!attack' && !msg.author.bot) {
		util.consoleMsg(msg.content);
		msg.delete(0).then().catch(console.error);
	}
	// If Game Command
	else if(prefix == process.env.GAME_PREFIX) {
		// Console Log
		util.consoleMsg("Game Prefix Sent");
		// Variables
		var correctChannel = util.isGameChannel(msg);
		var correctRole = util.isGameUser(msg.member)
		var commandStr = util.getCommand(msg, process.env.GAME_PREFIX);

		// If Game Channel
		if(util.isGameChannel(msg) && correctRole) {
			// Console Log
			util.consoleMsg("Game Command Issued");
			// Issue Command
			command.gameCommand(commandStr, msg);
		}
		// Else If Zone Channel
		else if(util.isZoneChannel(msg) && correctRole) {
			if(commandStr == 'attack') {
				attack(msg);
			}
			else{
				msg.delete(0).then().catch(console.error);
			}
		}
    // Else If DM
    else if(msg.channel.type === "dm"){
      switch(commandStr.toLowerCase()){
        case "focus":
        case "mana":
        case "energy":
        case "strength":
        case "determination":
          levelResource(msg);
          break;
        case "damage":
          levelDamage(msg);
          break;
        case "crit":
          levelCrit(msg);
          break;
        default:
          msg.author.send("I don't know that command. Is there a typo, or did you mean to post that in the monster zone?");
      }
    }
		// Else If No Role
		else if(correctRole == false) {
			util.consoleMsg("User Not Game User, No Command Issued");
		}
		// Else If Wrong Channel
		else if(util.isGameChannel(msg) == false || util.isZoneChannel(msg) == false) {
			util.consoleMsg("Prefix Sent To Incorrect Channel, No Command Issued");
		}
		else {
			util.consoleMsg("Wrong Channel & No User Role, No Command Issued");
		}

	}

}

/**
 * Start Guild Master
*/
function startGame(client) {
	// Create Log File
	util.createLogFile();
	util.logSettings();

	// Get Server (Guild)
	guild = getGuild(client);

  if(guild == null){
    throw "Guild is null - this is some bad news";
  }

  util.registerGuild(guild);

	// Associate Game Channel ID's
	// let zoneChannel = findZone(guild);
	// let leaderboardChannel = findLeaderboard(guild);

	// Load Game Data
	loadGameData();

	// Start Game Sync
	// var gamesync = setInterval(function() {
	// 	gameSync(client, guild, zoneChannel, leaderboardChannel);
	// }, 1 * 1000);
}

// Private Functions

/**
 * Get Guild
*/
function getGuild(client) {
	// Get Guild
	let gId = process.env.GUILD;
	console.log(gId);
	if (gId == undefined)
		throw "guild is not defined, who do you think you are?"
	let guild = client.guilds.get(gId);
	if (guild == undefined)
		throw "bot is not in the defined server, hello?"

	// Log Guild
	util.gameLog("Running on server: '" + guild.name + "'");

	return guild;
}

/**
 * Associate Channels: Zone
*/
function findZone(guild) {
	util.consoleMsg("Finding Zone...");
	var channels = guild.channels.array();
	var whiteListedChannels = serverConfig.zoneChannels;
	var zoneChannel = false;
	for(var a = 0; a < channels.length; a++) {
		for(var b = 0; b < whiteListedChannels.length; b++) {
			// If Zone Channel Match Found
			if(channels[a].name == whiteListedChannels[b]) {
				zoneChannel = channels[a];
				util.gameLog("Using Zone: '" + zoneChannel.name + "'");
				break;
			}
		}
	}
	// If No Zone Found
	if(zoneChannel == false) {
		util.gameLog("No Zone Found!");
	}
	return zoneChannel;
}

/**
 * Associate Channels: Leaderboard
*/
function findLeaderboard(guild) {
	util.consoleMsg("Finding Leaderboard...");
	var channels = guild.channels.array();
	var whiteListedChannels = serverConfig.leaderboardChannels;
	var leaderboardChannel = false;
	for(var a = 0; a < channels.length; a++) {
		for(var b = 0; b < whiteListedChannels.length; b++) {
			// If Zone Channel Match Found
			if(channels[a].name == whiteListedChannels[b]) {
				leaderboardChannel = channels[a];
				util.gameLog("Using Leaderboard: '" + leaderboardChannel.name + "'");
				break;
			}
		}
	}
	// If No Zone Found
	if(leaderboardChannel == false) {
		util.gameLog("No Leaderboard Found!");
	}
	return leaderboardChannel;
}

/**
 * Game Sync
*/
function gameSync(client, guild, zoneChannel, leaderboardChannel) {
	// Variables
	var currentTime = new Date();
	// Time Since Last Sync

	// If Over 1 Minute Since Last Save
	if((currentTime.getTime() - lastSave.getTime()) > (60 * 1000)) {
		// Resource Manager
		RM.sync();
		// Save Game
		saveGameData();
	}
	// Leaderboard first run
	if(firstfirst == true) {
		firstfirst = false
		LM.sync(leaderboardChannel, guild);
	}
	// Leaderboard Manager If > 5 Minutes
	if((currentTime.getTime() - lastLeaderboard.getTime()) > (60 * 1000)) {
		LM.sync(leaderboardChannel, guild);
		lastLeaderboard = new Date();
	}

	// Message Manager
	let mon = ZM.getMonster();
	if(mon != undefined && mon.message != undefined){
		MM.sync(ZM.getMonster());
	}

	// Zone Manager
	ZM.sync(zoneChannel);

	// Player State Manager

}

/**
 * Load Game Data
 */
function loadGameData() {
  // Initializes the database to pull all game data
	database.init();

  // Load all players
  for(let member of guild.members.array()){
  	if (member.user.bot)
  		continue;
  	let name = member.nickname;
  	if(name == null){
  		name = member.user.username;
  		if(name == null) throw 'wah'
  	}
    const id = member.id;

    if(member.id == null){
      continue;
    }

    let player = database.getPlayer(id);

    // If the member doesn't have a character yet, make one
    if(player == null){
      player = database.addPlayer(id, new Player());
      player.registerDiscordId(id);
      player.setName(name);
    }

    RM.trackPlayer(player);

    // // If the player already has a class assigned, continue loading members
    // if(player.class != null){
    //   continue;
    // }

    // If the player has a class role on Discord but not on the player object, assign it
    const roleClass = util.getMemberClassRole(member);
    if(roleClass == null){
      continue;
    }
    player.assignClass(roleClass);
    player.setName(name);

    database.updatePlayer(id, player);
  }

  database.savePlayers();
}

/**
 * Leaderboard Update
 */
function leaderboardUpdate() {

}

/**
 * Save Game Data
 */
function saveGameData() {
	util.consoleMsg(">Saving Game");
	lastSave = new Date();

	// Save Players
  	database.savePlayers();

	// Save Monsters

	// Save Zones

}

// Exports
module.exports = {
	memberUpdate,
	newMessage,
	startGame
}
