const mongoose = require("mongoose");
const { Schema } = mongoose;

const CDSecureTokenSchema = mongoose.Schema({
    userId: {
        type: String
    },
    token: { type: String },
    enableNotification: { type: Boolean, default: true}
}, { timestamps: true });

CDSecureTokenSchema.virtual('id').get(() => this._id);

CDSecureTokenSchema.set('toJSON', {
    virtuals: true,
});
const CDSecureToken = mongoose.model("CDSecureToken", CDSecureTokenSchema); 

module.exports = CDSecureToken;