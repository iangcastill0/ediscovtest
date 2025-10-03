const mongoose = require("mongoose");

const OneDriveArchiveSchema = mongoose.Schema({
    jobId: String,
    jobName: String,
    workspaceId: String,
    filters: Object,
    dataId: String,
    backups: Array,
    size: Number,
    clientId: String, // deprecated
    permission: {
        type: String,
        default: 'Write'
    }, 
    owner: String,
    createdBy: String
}, { timestamps: true });

OneDriveArchiveSchema.virtual('id').get(() => this._id);

OneDriveArchiveSchema.set('toJSON', {
    virtuals: true,
});
const OneDriveArchive = mongoose.model("OneDriveArchive", OneDriveArchiveSchema); 

module.exports = OneDriveArchive;