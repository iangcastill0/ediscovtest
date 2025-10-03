const mongoose = require("mongoose");

const BackupMessagesSchema = mongoose.Schema({
    archiveId: { type: mongoose.Schema.Types.ObjectId, ref: 'OutlookArchive' },
    backupId: String,
    dataId: String,
    messageIds: [Object]
}, { timestamps: true });

BackupMessagesSchema.virtual('id').get(function() {
    return this._id;
});

BackupMessagesSchema.set('toJSON', {
    virtuals: true,
});

const BackupMessages = mongoose.model("BackupMessages", BackupMessagesSchema);

module.exports = BackupMessages;
