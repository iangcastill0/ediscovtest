const mongoose = require("mongoose");
const User = require("./user")

const OutlookDownloadLogSchema = mongoose.Schema({
    messageId: String,
    logs: [Object]
}, { timestamps: true });

OutlookDownloadLogSchema.virtual('id').get(function() {
    return this._id;
});

OutlookDownloadLogSchema.set('toJSON', {
    virtuals: true,
});

const OutlookDownloadLog = mongoose.model("OutlookDownloadLog", OutlookDownloadLogSchema);

OutlookDownloadLog.addLog = async (messageId, log) => {
    const user = await User.findOne({_id: log.userId})
    log.userEmail = user?.email
    log.userName = user?.name
    const downloadsLog = await OutlookDownloadLog.findOne({messageId})
    if (downloadsLog) {
        await OutlookDownloadLog.updateOne({messageId}, { $push: { logs: log }})
    } else {
        await OutlookDownloadLog.create({messageId, logs: [log]})
    }
}

module.exports = OutlookDownloadLog;
