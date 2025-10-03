const SupportTicket = require('../models/support_ticket');
const ChatSession = require('../models/chat_session');
const SupportSettings = require('../models/support_settings');
const User = require('../models/user');

// Get user's tickets
exports.getUserTickets = async (req, res) => {
    try {
        const tickets = await SupportTicket.find({ userId: req.userId })
            .sort({ createdAt: -1 })
            .populate('assignedTo', 'email username')
            .lean();

        res.json({
            success: true,
            data: tickets
        });
    } catch (error) {
        console.error('Get user tickets error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch tickets'
        });
    }
};

// Create new ticket
exports.createTicket = async (req, res) => {
    try {
        const { subject, message, priority, category } = req.body;
        const user = await User.findById(req.userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        const ticketData = {
            userId: req.userId,
            userEmail: user.email,
            userName: user.username || user.email,
            subject,
            message,
            priority: priority || 'medium',
            category: category || 'general',
            history: [{
                from: 'user',
                message
            }]
        };

        // Handle file attachments
        if (req.files && req.files.length > 0) {
            ticketData.attachments = req.files.map(file => ({
                filename: file.filename,
                originalName: file.originalname,
                size: file.size,
                mimetype: file.mimetype
            }));
        }

        const ticket = new SupportTicket(ticketData);
        await ticket.save();

        // TODO: Send email notification to admin

        res.status(201).json({
            success: true,
            message: 'Ticket created successfully',
            data: ticket
        });
    } catch (error) {
        console.error('Create ticket error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create ticket'
        });
    }
};

// Get all tickets (admin)
exports.getAllTickets = async (req, res) => {
    try {
        const { status, priority, search, page = 1, limit = 20 } = req.query;
        let filter = {};

        if (status && status !== 'all') filter.status = status;
        if (priority) filter.priority = priority;
        if (search) {
            filter.$or = [
                { ticketId: { $regex: search, $options: 'i' } },
                { subject: { $regex: search, $options: 'i' } },
                { userName: { $regex: search, $options: 'i' } }
            ];
        }

        const tickets = await SupportTicket.find(filter)
            .sort({ lastResponseAt: -1, createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .populate('userId', 'email username')
            .populate('assignedTo', 'email username')
            .lean();

        const total = await SupportTicket.countDocuments(filter);

        res.json({
            success: true,
            data: {
                tickets,
                pagination: {
                    currentPage: page,
                    totalPages: Math.ceil(total / limit),
                    totalItems: total
                }
            }
        });
    } catch (error) {
        console.error('Get all tickets error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch tickets'
        });
    }
};

// Get ticket statistics
exports.getTicketStats = async (req, res) => {
    try {
        const [open, pending, resolved, thisWeek] = await Promise.all([
            SupportTicket.countDocuments({ status: 'open' }),
            SupportTicket.countDocuments({ status: 'pending' }),
            SupportTicket.countDocuments({ status: 'resolved' }),
            SupportTicket.countDocuments({
                status: 'resolved',
                resolvedAt: {
                    $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
                }
            })
        ]);

        // Get priority distribution
        const priorityStats = await SupportTicket.aggregate([
            { $group: { _id: '$priority', count: { $sum: 1 } } }
        ]);

        // Get category distribution
        const categoryStats = await SupportTicket.aggregate([
            { $group: { _id: '$category', count: { $sum: 1 } } }
        ]);

        res.json({
            success: true,
            data: {
                statusStats: { open, pending, resolved },
                thisWeekResolved: thisWeek,
                priorityStats,
                categoryStats
            }
        });
    } catch (error) {
        console.error('Get ticket stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch statistics'
        });
    }
};

// Update ticket status
exports.updateTicketStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const ticketId = req.params.id;

        const updateData = {
            status,
            lastResponseAt: new Date()
        };

        if (status === 'resolved') {
            updateData.resolvedAt = new Date();
        }

        const ticket = await SupportTicket.findByIdAndUpdate(
            ticketId,
            updateData,
            { new: true }
        );

        if (!ticket) {
            return res.status(404).json({
                success: false,
                message: 'Ticket not found'
            });
        }

        res.json({
            success: true,
            message: 'Ticket status updated',
            data: ticket
        });
    } catch (error) {
        console.error('Update ticket status error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update ticket status'
        });
    }
};

// Add admin reply to ticket
exports.addAdminReply = async (req, res) => {
    try {
        const { message } = req.body;
        const ticketId = req.params.id;

        const ticket = await SupportTicket.findById(ticketId);
        if (!ticket) {
            return res.status(404).json({
                success: false,
                message: 'Ticket not found'
            });
        }

        ticket.history.push({
            from: 'admin',
            message,
            adminId: req.userId
        });

        ticket.lastResponseAt = new Date();
        await ticket.save();

        // TODO: Send email notification to user

        res.json({
            success: true,
            message: 'Reply added successfully',
            data: ticket
        });
    } catch (error) {
        console.error('Add admin reply error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to add reply'
        });
    }
};

// Get support settings
exports.getSettings = async (req, res) => {
    try {
        let settings = await SupportSettings.findOne();
        if (!settings) {
            settings = new SupportSettings();
            await settings.save();
        }

        res.json({
            success: true,
            data: settings
        });
    } catch (error) {
        console.error('Get settings error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch settings'
        });
    }
};

// Update support settings
exports.updateSettings = async (req, res) => {
    try {
        const settings = await SupportSettings.findOneAndUpdate(
            {},
            req.body,
            { new: true, upsert: true }
        );

        res.json({
            success: true,
            message: 'Settings updated successfully',
            data: settings
        });
    } catch (error) {
        console.error('Update settings error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update settings'
        });
    }
};