const mongoose = require("mongoose");
const { Schema } = mongoose;

const BoxMemberSchema = mongoose.Schema({
    workspaceId: String,
    memberId: String,
    name: String,
    login: Object,
    language: String,
    timezone: String,
    created_at: String,
    modified_at: String,
    space_amount: Number,
    space_used: Number,
    max_upload_ise: Number,
    status: String,
    job_title: String,
    phone: String,
    address: String,
    avatar_url: String,
    notification_email: String,
}, { timestamps: true });

BoxMemberSchema.virtual('id').get(() => this._id);

BoxMemberSchema.set('toJSON', {
    virtuals: true,
});
const BoxMember = mongoose.model("BoxMember", BoxMemberSchema); 

module.exports = BoxMember;