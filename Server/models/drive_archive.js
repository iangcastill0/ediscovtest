const mongoose = require("mongoose");

const DriveArchiveSchema = mongoose.Schema({
    jobId: String,
    jobName: String,
    workspaceId: String,
    filters: Object,
    backups: Array,
    size: Number,
    clientId: String,
    owner: String,
    createdBy: String,
    permission: {
        type: String,
        default: 'Write'
    }
}, { timestamps: true });

DriveArchiveSchema.virtual('id').get(() => this._id);

DriveArchiveSchema.set('toJSON', {
    virtuals: true,
});
const DriveArchive = mongoose.model("DriveArchive", DriveArchiveSchema); 

module.exports = DriveArchive;