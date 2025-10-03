const mongoose = require("mongoose");

const MS365TokensSchema = mongoose.Schema({
    userId: {
        type: String
    },
    account: {
        type: Object
    },
    tokenCache: {
        type: String
    },
    accessToken: {
        type: String
    }
}, { timestamps: true });

MS365TokensSchema.virtual('id').get(() => this._id);

MS365TokensSchema.set('toJSON', {
    virtuals: true,
});
const MS365Tokens = mongoose.model("MS365Tokens", MS365TokensSchema); 

module.exports = MS365Tokens;