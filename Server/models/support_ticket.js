// models/support_ticket.js

const mongoose = require('mongoose');
const shortid = require('shortid'); // Import the library

const supportTicketSchema = new mongoose.Schema({
    ticketId: {
        type: String,
        required: true,
        unique: true,
        default: shortid.generate // Use shortid to generate the ID
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    userEmail: String,
    userName: String,
    subject: {
        type: String,
        required: true
    },
    message: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['open', 'pending', 'resolved', 'closed'],
        default: 'open'
    },
    priority: {
        type: String,
        enum: ['low', 'medium', 'high'],
        default: 'medium'
    },
    category: {
        type: String,
        default: 'general'
    },
    history: [{
        from: { type: String, enum: ['user', 'admin'] },
        message: String,
        adminId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        timestamp: { type: Date, default: Date.now }
    }],
    attachments: [{
        filename: String,
        originalName: String,
        size: Number,
        mimetype: String
    }],
    assignedTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    resolvedAt: Date,
    lastResponseAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true // Adds createdAt and updatedAt
});

// PRE-SAVE HOOK: This is the key change!
// This function will run before a document is saved.
supportTicketSchema.pre('save', function (next) {
    // We only want to generate a ticketId if the document is new.
    if (this.isNew) {
        this.ticketId = shortid.generate();
    }
    next(); // Continue with the save operation
});

module.exports = mongoose.model('SupportTicket', supportTicketSchema);