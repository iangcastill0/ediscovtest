const mongoose = require("mongoose");
const { Schema } = mongoose;

const ArchiveCronSchema = mongoose.Schema({
    userid: {
        type: String
    },
    time: {
      type: Number
    }
}, { timestamps: true });

ArchiveCronSchema.virtual('id').get(() => this._id);

ArchiveCronSchema.set('toJSON', {
    virtuals: true,
});
const ArchiveCron = mongoose.model("ArchiveCron", ArchiveCronSchema); 

module.exports = ArchiveCron;