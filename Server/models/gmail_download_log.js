const mongoose = require("mongoose");
const User = require("./user")

const GmailDownloadLogSchema = mongoose.Schema({
    messageId: String,
    logs: [Object]
}, { timestamps: true });

GmailDownloadLogSchema.virtual('id').get(function() {
    return this._id;
});

GmailDownloadLogSchema.set('toJSON', {
    virtuals: true,
});

const GmailDownloadLog = mongoose.model("GmailDownloadLog", GmailDownloadLogSchema);

GmailDownloadLog.addLog = async (messageId, log) => {
    const user = await User.findOne({_id: log.userId})
    log.userEmail = user?.email
    log.userName = user?.name
    const downloadsLog = await GmailDownloadLog.findOne({messageId})
    if (downloadsLog) {
        await GmailDownloadLog.updateOne({messageId}, { $push: { logs: log }})
    } else {
        await GmailDownloadLog.create({messageId, logs: [log]})
    }
}

module.exports = GmailDownloadLog;
