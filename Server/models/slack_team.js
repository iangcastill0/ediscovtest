const mongoose = require("mongoose");
const { Schema } = mongoose;

const SlackTeamSchema = mongoose.Schema({
    team_id: {
        type: String
    },
    name: {
        type: String
    },
    accessToken: {
        type: String
    },
    clientId: {
        type: Schema.Types.ObjectId, ref: 'User'
    },
    members:[{ type: Schema.Types.ObjectId, ref: 'SlackMember' }],
    archiveState: {
        type: Schema.Types.ObjectId, ref: 'ArchiveState'
    },
    permission: {
        type: String,
        default: "Write"
    }
}, { timestamps: true });

SlackTeamSchema.virtual('id').get(() => this._id);

SlackTeamSchema.set('toJSON', {
    virtuals: true,
});
const SlackTeam = mongoose.model("SlackTeam", SlackTeamSchema); 

module.exports = SlackTeam;