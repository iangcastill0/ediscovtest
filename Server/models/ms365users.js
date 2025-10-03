const mongoose = require("mongoose");

const MS365UsersSchema = mongoose.Schema({
    workspaceId: {
        type: String
    },
    userId: {
        type: String
    },
    businessPhones: {
        type: Array,
        default: []
    },
    displayName: {
        type: String
    },
    givenName: {
        type: String
    },
    jobTitle: {
        type: String
    },
    mail: {
        type: String
    },
    mobilePhone: {
        type: String
    },
    officeLocation: {
        type: String
    },
    preferredLanguage: {
        type: String
    },
    surname: {
        type: String
    },
    userPrincipalName: {
        type: String
    },
    isAuthorized: Boolean,
    accessToken: String
}, { timestamps: true });

MS365UsersSchema.virtual('id').get(() => this._id);

MS365UsersSchema.set('toJSON', {
    virtuals: true,
});
const MS365Users = mongoose.model("MS365Users", MS365UsersSchema); 

module.exports = MS365Users;