const mongoose = require("mongoose");
const { Schema } = mongoose;

const FlaggedCollectionSchema = mongoose.Schema({
    userId: {
        type: String
    },
    collectionId: {type: String},
    type: {type: String},
    data: {type: Object}
}, { timestamps: true });

FlaggedCollectionSchema.virtual('id').get(() => this._id);

FlaggedCollectionSchema.set('toJSON', {
    virtuals: true,
});
const FlaggedCollection = mongoose.model("FlaggedCollection", FlaggedCollectionSchema); 

module.exports = FlaggedCollection;