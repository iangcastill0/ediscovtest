const mongoose = require("mongoose");
const { Schema } = mongoose;

const ArchiveLogSchema = mongoose.Schema({
    team_id: {
        type: String
    },
    type: {
      type: String
    },
    name: {
        type: String
    },
    log: {
        type: String
    },
    note: String
}, { timestamps: true });

ArchiveLogSchema.virtual('id').get(() => this._id);

ArchiveLogSchema.set('toJSON', {
    virtuals: true,
});
const ArchiveLog = mongoose.model("ArchiveLog", ArchiveLogSchema); 

module.exports = ArchiveLog;