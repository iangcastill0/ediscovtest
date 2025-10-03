const mongoose = require("mongoose");
const { Schema } = mongoose;

const CollectionListSchema = mongoose.Schema({
    userId: {
        type: String
    },
    name: {type: String},
    color: {type: String}
}, { timestamps: true });

CollectionListSchema.virtual('id').get(() => this._id);

CollectionListSchema.set('toJSON', {
    virtuals: true,
});
const CollectionList = mongoose.model("CollectionList", CollectionListSchema); 

module.exports = CollectionList;