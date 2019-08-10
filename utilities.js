// Include
const serverConfig = require('./settings/server-config.js');
const fs = require('fs');
const Error = require('./errors.js');

// Variables
const serverStarted = new Date();
const instanceName = serverStarted.toString()
						.replace(" GMT-0700 (Pacific Daylight Time)", "")
						.split(' ').join('-')
						.split(':').join('-');
const logFile = "./logs/" + instanceName + ".txt";

// Public Functions

/**
 * Console
 */
function consoleMsg(messageStr) {
	if(process.env.CONSOLE == "true") {
		console.log(messageStr);
	}
}

/**
 * Create Log File
*/
function createLogFile() {
	fs.writeFile(logFile, instanceName + "\n" + "\n", (err) => {
    	if (err) throw err;
	});
}

/**
 * Get Command Str
 *
 * @param {Object}		discord.js message
 */
function getCommand(msg, prefix) {
	var msgArgs = msg.content.split(" ");
	var firstArg = msgArgs[0].replace(prefix, "");
	return firstArg;
}

/**
 * Get Member Game Role
 */
function getMemberClassRole(member) {
	if(member.roles == undefined) {
		return null;
	}
	var userRoles = member.roles.array();
	if(userRoles == undefined) {
		return null;
	}
	var classRoles = serverConfig.classRoles;
	for(var a = 0; a < userRoles.length; a++) {
		for(var b = 0; b < classRoles.length; b++) {
			if(userRoles[a] !== undefined && userRoles[a].name == classRoles[b]) {
				consoleMsg(member.nickname + " is a " + classRoles[b]);
				return classRoles[b];
			}
		}
	}
	return null;
}

/**
 * Is Admin User
 */
function isAdmin(member) {
	var userRoles = member.roles.array();
	if(userRoles == undefined) {
		return false;
	}
	var adminRoles = serverConfig.adminRoles;
	// Cross reference userRoles vs adminRoles
	for(var a = 0; a < userRoles.length; a++) {
		for(var b = 0; b < adminRoles.length; b++) {
			// Compare User Role vs Whitelisted Role
			if(userRoles[a] !== undefined && userRoles[a].name == adminRoles[b]) {
				consoleMsg(member.nickname + " is an Admin");
				// Return true if role found within whitelist
				return true;
			}
		}
	}
	return false;
}

/**
 * Is Game User
 */
function isGameUser(member) {
  if(member == null || member.roles == null){
    // probably a DM; break
    return false;
  }
	var userRoles = member.roles.array();
	if(userRoles == undefined) {
		return false;
	}
	var gameRoles = serverConfig.gameRoles;
	// Cross reference userRoles vs adminRoles
	for(var a = 0; a < userRoles.length; a++) {
		for(var b = 0; b < gameRoles.length; b++) {
			if(userRoles[a] !== undefined && userRoles[a].name == gameRoles[b]) {
				if(member.nickname != null){
					consoleMsg(member.nickname + " is a game player");
				} else {
					consoleMsg(member.displayName + " is a game player (no nickname set)");
				}
				// Return true if role found within whitelist
				return true;
			}
		}
	}
	return false;
}

/**
 * Is Admin Channel
 */

/**
 * Is Game Channel
 */
function isGameChannel(msg) {
	if(msg.channel.name == undefined) {
		return false;
	}
	var channel = msg.channel.name;
	var gameChannels = serverConfig.gameChannels;
	// Cross reference channel vs gameChannels
	for(var a = 0; a < gameChannels.length; a++) {
		if(channel == gameChannels[a]) {
			return true;
		}
	}
	return false;
}

/**
 * Is Zone Channel
 */
function isZoneChannel(msg) {
	if(msg.channel.name == undefined) {
		return false;
	}
	var channel = msg.channel.name;
	var zoneChannels = serverConfig.zoneChannels;
	// Cross reference channel vs gameChannels
	for(var a = 0; a < zoneChannels.length; a++) {
		if(channel == zoneChannels[a]) {
			return true;
		}
	}
	return false;
}

/**
 * Log Settings
*/
function logSettings() {
	var toLog = "";
	toLog += ("\n" + "------------------------------" + "\n");
	// Environment
	toLog += ("Environment Setting Group: " + process.env.SETTINGS + "\n")
	// Admin Roles
	toLog += ("Admin Roles Enabled: " + serverConfig.adminRoles.length + "\n");
	// Game Channels
	toLog += ("Game Channels Whitelisted: " + serverConfig.gameChannels.length + "\n");
	// Admin Prefix
	toLog += ("Admin Prefix: " + process.env.ADMIN_PREFIX + "\n");
	// Game Prefix
	toLog += ("Game Prefix: " + process.env.GAME_PREFIX + "\n");
	// Console Debugging
	toLog += ("Console Debugging: " + process.env.CONSOLE + "\n")
	toLog += ("------------------------------" + "\n" + "\n");
	gameLog(toLog);
}

/**
 * Game Log
 */
function gameLog(logMsg) {
	var current = new Date();
	// Console Log
	console.log(logMsg);
	// Write To Log
	fs.appendFile(logFile, logMsg + "\n", function (err) {
		if (err) throw err;
	});
}

/**
 * Sends a private message to a user.
 * @param  {GuildMember} member guild member to PM
 * @param  {string}      msg    message to send to the user
 * @return {string}             result of the operation
 */
function sendPM(member, msg) {
  if (member == null){
    consoleMsg("Attempted to PM a null user; aborting.");
    return Error.INVALID_PM_TARGET;
  }

  member.send(msg);
  return Error.GLOBAL_SUCCESS;
}

function registerGuild(guildInfo){
  guild = guildInfo;
}

function getMemberFromDiscordId(id){
  if(guild == null){
    throw "Guild not set in utilities.js - call registerGuild() first";
  }

  return guild.members.find("id", id);
}

// Private Functions

// Exports
module.exports = {
	getMemberClassRole,
	consoleMsg,
	createLogFile,
	getCommand,
	gameLog,
	isAdmin,
	isGameUser,
	isGameChannel,
	isZoneChannel,
	logSettings,
  sendPM,
  registerGuild,
  getMemberFromDiscordId
}
