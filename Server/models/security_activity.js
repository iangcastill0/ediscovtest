const mongoose = require("mongoose");
const { Schema } = mongoose;

const SecurityActivitySchema = mongoose.Schema({
    user: {
        type: Schema.Types.ObjectId, ref: 'User'
    },
    type: {
      type: String,
    },
    note: String
}, { timestamps: true });

SecurityActivitySchema.virtual('id').get(() => this._id);

SecurityActivitySchema.set('toJSON', {
    virtuals: true,
});
const SecurityActivity = mongoose.model("SecurityActivity", SecurityActivitySchema); 

module.exports = SecurityActivity;