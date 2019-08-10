// Variables

// Array of roles that can issue admin commands
const adminRoles = [
	"Bot - Dev"
];

// Array of roles that correspond to a class
const classRoles = [
	"titan",
	"mage",
	"rogue",
	"knight"
]

// Array of roles that can play game
const gameRoles = [
	"Bot - Dev",
	"titan",
	"mage",
	"rogue",
	"knight",
	"player"
];

// Array of acceptable channels to play game
const gameChannels = [
	"bot-test",
	"tavern"
];

// Array of leaderboard channels
const leaderboardChannels = [
	"leaderboard"
]

// Array of acceptable zone channels
const zoneChannels = [
	"zone_dev",
	"zone",
	"the_fruitlands",
	"the_barrier_crests",
	"glacier_peak"
];


// Exports
module.exports = {
	adminRoles,
	classRoles,
	gameRoles,
	gameChannels,
	leaderboardChannels,
	zoneChannels
}