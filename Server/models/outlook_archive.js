const mongoose = require("mongoose");

const OutlookArchiveSchema = mongoose.Schema({
    jobId: String,
    jobName: String,
    workspaceId: String,
    filters: Object,
    backups: Array, // Storing dataId as string
    size: Number,
    totalCount: Number,
    clientId: String,  // deprecated
    permission: {
        type: String,
        default: 'Write'
    },
    owner: String,
    createdBy: String
}, { timestamps: true });

OutlookArchiveSchema.virtual('id').get(function() {
    return this._id;
});

OutlookArchiveSchema.set('toJSON', {
    virtuals: true,
});

const OutlookArchive = mongoose.model("OutlookArchive", OutlookArchiveSchema);

module.exports = OutlookArchive;
