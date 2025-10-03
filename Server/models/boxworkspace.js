const mongoose = require("mongoose");
const { Schema } = mongoose;

const BoxWorkspaceSchema = mongoose.Schema({
    teamId: String,
    displayName: String,
    isPersonal: Boolean,
    accessToken: String,
    refreshToken: String,
    owner: String
}, { timestamps: true });

BoxWorkspaceSchema.virtual('id').get(() => this._id);

BoxWorkspaceSchema.set('toJSON', {
    virtuals: true,
});
const BoxWorkspace = mongoose.model("BoxWorkspace", BoxWorkspaceSchema); 

module.exports = BoxWorkspace;