// discord.js (https://discord.js.org)
const Discord = require('discord.js');
const client = new Discord.Client();
// util
const log = require('./utilities.js').gameLog();

// guild-master
const GM = require('./guild-master.js');

// On  Client Event: 'ready'
client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
  // Start Guild Master
  GM.startGame(client);
});

// On Client Event 'message'
// Gets any message in any channel that bot has permissions to
client.on('message', (msg) => {
  GM.newMessage(msg);
});

// On Member Update
client.on('guildMemberUpdate', (oldMember, newMember) => {
  GM.memberUpdate(oldMember, newMember);
});


// Login bot
client.login(process.env.BOT_TOKEN);