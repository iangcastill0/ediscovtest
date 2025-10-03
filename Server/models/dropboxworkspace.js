const mongoose = require("mongoose");
const { Schema } = mongoose;

const DropboxWorkspaceSchema = mongoose.Schema({
    teamId: String,
    displayName: String,
    isPersonal: Boolean,
    accessToken: String,
    refreshToken: String,
    owner: String
}, { timestamps: true });

DropboxWorkspaceSchema.virtual('id').get(() => this._id);

DropboxWorkspaceSchema.set('toJSON', {
    virtuals: true,
});
const DropboxWorkspace = mongoose.model("DropboxWorkspace", DropboxWorkspaceSchema); 

module.exports = DropboxWorkspace;