const mongoose = require("mongoose");

const GmailArchiveSchema = mongoose.Schema({
    jobId: String,
    jobName: String,
    workspaceId: String,
    filters: Object,
    backups: Array,
    size: Number,
    totalCount: Number,
    clientId: String, //deprecated
    permission: {
        type: String,
        default: 'Write'
    },
    owner: String,
    createdBy: String
}, { timestamps: true });

GmailArchiveSchema.virtual('id').get(() => this._id);

GmailArchiveSchema.set('toJSON', {
    virtuals: true,
});
const GmailArchive = mongoose.model("GmailArchive", GmailArchiveSchema); 

module.exports = GmailArchive;