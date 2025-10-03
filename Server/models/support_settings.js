const mongoose = require('mongoose');

const supportSettingsSchema = new mongoose.Schema({
  chatHours: {
    start: { type: Number, default: 9, min: 0, max: 23 },
    end: { type: Number, default: 17, min: 0, max: 23 },
    timezone: { type: String, default: 'America/New_York' }
  },
  autoResponses: {
    welcomeMessage: { 
      type: String, 
      default: "Hello! How can we help you today?" 
    },
    offlineMessage: { 
      type: String, 
      default: "We're currently offline. Please leave a message and we'll get back to you." 
    }
  },
  emailNotifications: {
    newTicket: { type: Boolean, default: true },
    newChat: { type: Boolean, default: true },
    adminEmail: { type: String, default: 'admin@company.com' }
  },
  ticketSettings: {
    autoAssignment: { type: Boolean, default: false },
    defaultPriority: { type: String, default: 'medium' }
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('SupportSettings', supportSettingsSchema);