const mongoose = require("mongoose");
const { Schema } = mongoose;

const UserActions = mongoose.model(
  "UserActions",
  new mongoose.Schema({
    userId: {
        type: Schema.Types.ObjectId, ref: 'User' 
    },
    email: String,
    ipAddress: String,
    actionType: String,
    actionDetails: String,
    actionResult: String,
    deviceInfo: String,
    url: String
  }, { timestamps: true })
);

module.exports = UserActions;
