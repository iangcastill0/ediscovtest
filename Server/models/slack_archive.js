const mongoose = require("mongoose");

const SlackArchiveSchema = mongoose.Schema({
    team: {
        type: String
    },
    backups: [{
        id: String,
        dataId: String,
        backedAt: String,
        size: Number,
        note: String,
        channelList: { type: Object },
        userList: { type: Object },
        directChannel: { type: Object },
        conversationHistory: { type: Object },
    }],
    clientId: {
        type: String
    }
}, { timestamps: true });

SlackArchiveSchema.virtual('id').get(() => this._id);

SlackArchiveSchema.set('toJSON', {
    virtuals: true,
});
const SlackArchive = mongoose.model("SlackArchive", SlackArchiveSchema); 

module.exports = SlackArchive;