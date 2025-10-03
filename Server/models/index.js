const mongoose = require('mongoose');
mongoose.Promise = global.Promise;

const db = {};

db.mongoose = mongoose;

db.user = require("./user");
db.role = require("./role");
db.slackMember = require("./slack_member");
db.slackTeam = require("./slack_team");

db.ROLES = ["client", "admin"];

module.exports = db;