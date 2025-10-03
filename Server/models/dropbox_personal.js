const mongoose = require("mongoose");
const { Schema } = mongoose;

const DropboxPersonalSchema = mongoose.Schema({
    accId: String,
    displayName: String,
    email: Object,
    country: String,
    disabled: Boolean,
    accessToken: String,
    refreshToken: String,
    owner: String
}, { timestamps: true });

DropboxPersonalSchema.virtual('id').get(() => this._id);

DropboxPersonalSchema.set('toJSON', {
    virtuals: true,
});
const DropboxPersonal = mongoose.model("DropboxPersonal", DropboxPersonalSchema); 

module.exports = DropboxPersonal;