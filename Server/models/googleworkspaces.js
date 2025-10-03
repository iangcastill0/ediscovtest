const mongoose = require("mongoose");
const { Schema } = mongoose;

const GoogleWorkspaceSchema = mongoose.Schema({
    orgId: String,
    displayName: String,
    orgObject: Object,
    accessToken: Object,
    clientId: String,
    isPersonal: {
        type: Boolean,
        default: false
    },
    permission: {
        type: String,
        default: "Write"
    }
}, { timestamps: true });

GoogleWorkspaceSchema.virtual('id').get(() => this._id);

GoogleWorkspaceSchema.set('toJSON', {
    virtuals: true,
});
const GoogleWorkspace = mongoose.model("GoogleWorkspace", GoogleWorkspaceSchema); 

module.exports = GoogleWorkspace;