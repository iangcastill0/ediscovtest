const mongoose = require("mongoose");

const DropboxArchiveSchema = mongoose.Schema({
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

DropboxArchiveSchema.virtual('id').get(() => this._id);

DropboxArchiveSchema.set('toJSON', {
    virtuals: true,
});
const DropboxArchive = mongoose.model("DropboxArchive", DropboxArchiveSchema); 

module.exports = DropboxArchive;