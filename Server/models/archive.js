const mongoose = require("mongoose");
const { Schema } = mongoose;

const ArchiveSchema = mongoose.Schema({
    team_id: {
        type: String
    },
    channelList: { type: Object },
    userList: { type: Object },
    directChannel: { type: Object },
    conversationHistory: { type: Object },
    history: { type: Object },
    slack: {
        type: Object
    },
    googleWorkspace: {
        type: Object
    },
    mc365: {
        type: Object
    }
}, { timestamps: true });

ArchiveSchema.virtual('id').get(() => this._id);

ArchiveSchema.set('toJSON', {
    virtuals: true,
});
const Archive = mongoose.model("Archive", ArchiveSchema); 

module.exports = Archive;