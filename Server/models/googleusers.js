const mongoose = require("mongoose");

const GoogleUsersSchema = mongoose.Schema({
    workspaceId: {
        type: String
    },
    userId: {
        type: String
    },
    displayName: {
        type: String
    },
    mail: {
        type: String
    },
    isAdmin: Boolean,
    isAuthorized: Boolean,
    accessToken: String
}, { timestamps: true });

GoogleUsersSchema.virtual('id').get(() => this._id);

GoogleUsersSchema.set('toJSON', {
    virtuals: true,
});
const GoogleUsers = mongoose.model("GoogleUsers", GoogleUsersSchema); 

module.exports = GoogleUsers;