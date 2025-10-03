const mongoose = require("mongoose");
const { Schema } = mongoose;

const InviteUsersSchema = mongoose.Schema({
    userId: String,
    invitedUser: String,
    permissionType: String,
    globalPermission: String,
    workspacePermissions: {
        slack:[],
        ms365:[],
        google:[],
        dropbox:[],
    },
    status: String,
    token: String,
    expiresAt: Date
}, { timestamps: true });

InviteUsersSchema.virtual('id').get(() => this._id);

InviteUsersSchema.set('toJSON', {
    virtuals: true,
});
const InviteUsers = mongoose.model("InviteUsers", InviteUsersSchema); 

module.exports = InviteUsers;