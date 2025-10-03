const mongoose = require("mongoose");
const { Schema } = mongoose;

const MS365WorkspaceSchema = mongoose.Schema({
    orgId: String,
    displayName: String,
    orgObject: Object,
    accessToken: String,
    clientId: String,
    permission: {
        type: String,
        default: "Write"
    },
}, { timestamps: true });

MS365WorkspaceSchema.virtual('id').get(() => this._id);

MS365WorkspaceSchema.set('toJSON', {
    virtuals: true,
});
const MS365Workspace = mongoose.model("MS365Workspace", MS365WorkspaceSchema); 

module.exports = MS365Workspace;