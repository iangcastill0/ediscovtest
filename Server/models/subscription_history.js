const mongoose = require("mongoose");

const SubscriptionHistorySchema = mongoose.Schema({
    eventId: String,
    eventType: String,
    eventCreated: Date,
    dataType: String,
    dataId: String,
    data: Object
}, { timestamps: true });

SubscriptionHistorySchema.virtual('id').get(() => this._id);

SubscriptionHistorySchema.set('toJSON', {
    virtuals: true,
});
const SubscriptionHistory = mongoose.model("SubscriptionHistory", SubscriptionHistorySchema); 

module.exports = SubscriptionHistory;