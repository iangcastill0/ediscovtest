const mongoose = require("mongoose");

const SlackArchiveSchema = mongoose.Schema({
    team: String,
    memberId: String,
    jobId: String,
    JobName: String,
    filters: Object,
    email: String,
    dataIds: Object,
    size: Number,
    channels: Object,
    clientId: String, // deprecated
    owner: String,
    createdBy: String,
    permission: {
        type: String,
        default: 'Write'
    }
}, { timestamps: true });

SlackArchiveSchema.virtual('id').get(() => this._id);

SlackArchiveSchema.set('toJSON', {
    virtuals: true,
});
const SlackArchive2 = mongoose.model("SlackArchive2", SlackArchiveSchema);

module.exports = SlackArchive2;