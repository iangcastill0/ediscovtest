const mongoose = require("mongoose");
const { Schema } = mongoose;

const ArchiveStateSchema = mongoose.Schema({
    type: {
        type: String,
        enum: ['Slack', 'GoogleWorkspace', 'Outlook', 'OneDrive', 'MS365', 'Google', 'Dropbox', 'Box', 'FlaggedCollections']
    },
    detailType: String,
    appId: {
        type: String
    },
    filters: {
        type: Object
    },
    archiveId: String,
    totalCount: Number,
    processedCount: Number,
    deletedCount: Number,
    state: {
        type: String,
        enum: ['none', 'queued', 'progress', 'completed', 'error', 'delete'],
        default: 'none'
    },
    note: {
        type: String
    },
    userId: String, //deprecated
    owner: String,
    createdBy: String
}, { timestamps: true });

ArchiveStateSchema.virtual('id').get(() => this._id);

ArchiveStateSchema.set('toJSON', {
    virtuals: true,
});
const ArchiveState = mongoose.model("ArchiveState", ArchiveStateSchema); 

module.exports = ArchiveState;