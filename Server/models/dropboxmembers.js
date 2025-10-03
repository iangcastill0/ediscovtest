const mongoose = require("mongoose");
const { Schema } = mongoose;

const DropboxMembersSchema = mongoose.Schema({
    workspaceId: String,
    accountId: String,
    memberId: String,
    email: Object,
    emailVerified: String,
    name: String,
    joinedOn: String,
    profilePhotoUrl: String,
    groups: Array,
    status: Object,

}, { timestamps: true });

DropboxMembersSchema.virtual('id').get(() => this._id);

DropboxMembersSchema.set('toJSON', {
    virtuals: true,
});
const DropboxMembers = mongoose.model("DropboxMembers", DropboxMembersSchema); 

module.exports = DropboxMembers;