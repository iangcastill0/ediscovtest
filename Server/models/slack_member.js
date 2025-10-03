const mongoose = require("mongoose");
const { Schema } = mongoose;

const SlackMemberSchema = mongoose.Schema({
    team: {
        type: Schema.Types.ObjectId, ref: 'SlackTeam'
    },
    user_id: {
        type: String
    },
    email: {
        type: String
    },
    name: {
        type: String
    },
    real_name: {
        type: String
    },
    display_name: {
        type: String
    },
    tz: {
        type: String
    },
    title: {
        type: String
    },
    phone: {
        type: String
    },
    avatar: {
        type: String
    },
    color: {
        type: String
    },
    deleted: {
        type: Boolean
    },
    is_admin: {
        type: Boolean
    },
    is_owner: {
        type: Boolean
    },
    is_primary_owner: {
        type: Boolean
    },
    is_authed: {
        type: Boolean
    },
    is_bot: {
        type: Boolean,
        default: false
    },
    is_team_user: {
        type: Boolean,
        default: true
    },
    access_token: String,
    authenticated : {
        type: Boolean,
        default: false
    },
    
}, { timestamps: true });

SlackMemberSchema.virtual('id').get(() => this._id);

SlackMemberSchema.set('toJSON', {
    virtuals: true,
});

const SlackMember = mongoose.model("SlackMember", SlackMemberSchema);
module.exports = SlackMember;