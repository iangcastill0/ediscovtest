const mongoose = require("mongoose");

const FlaggedArchiveSchema = mongoose.Schema({
    jobId: String,
    jobName: String,
    filters: Object,
    backups: Array,
    size: Number,
    totalCount: Number,
    clientId: String,  // deprecated
    permission: {
        type: String,
        default: 'Write'
    },
    owner: String,
    createdBy: String,
    version: Number
}, { timestamps: true });

FlaggedArchiveSchema.virtual('id').get(function() {
    return this._id;
});

FlaggedArchiveSchema.set('toJSON', {
    virtuals: true,
});

const FlaggedArchive = mongoose.model("FlaggedArchive", FlaggedArchiveSchema);

module.exports = FlaggedArchive;
