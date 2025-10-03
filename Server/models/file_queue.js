const mongoose = require("mongoose");

const FileQueueSchema = mongoose.Schema({
    workspaceId: String,
    archiveId: String,
    fileId: String,
    fileName: String,
    fileType: String,
    hash: String,
    size: Number,
    s3Key: String,
    indexId: String,
    state: String,
    owner: String,
    collectedBy: String
}, { timestamps: true });

FileQueueSchema.virtual('id').get(() => this._id);

FileQueueSchema.set('toJSON', {
    virtuals: true,
});
const FileQueue = mongoose.model("FileQueue", FileQueueSchema);

module.exports = FileQueue;