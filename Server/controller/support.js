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
            userName: user.name || user.email,
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
        const [open, pending, resolvedThisWeek] = await Promise.all([
            SupportTicket.countDocuments({ status: 'open' }),
            SupportTicket.countDocuments({ status: 'pending' }),
            SupportTicket.countDocuments({
                status: 'resolved',
                resolvedAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
            })
        ]);
        res.json({
            success: true,
            data: { open, pending, resolvedThisWeek } // Simplified structure
        });
    } catch (error) {
        console.error('Get ticket stats error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch statistics' });
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
        // Now accepts 'status' from the request body
        const { message, status } = req.body;
        const ticketId = req.params.id;

        const ticket = await SupportTicket.findById(ticketId);
        if (!ticket) {
            return res.status(404).json({ success: false, message: 'Ticket not found' });
        }

        // Add reply to history ONLY if a message was provided
        if (message && message.trim() !== '') {
            ticket.history.push({
                from: 'admin',
                message,
                adminId: req.userId // Assumes admin's ID is available from auth middleware
            });
        }

        // Update status if it's provided and different
        if (status && ticket.status !== status) {
            ticket.status = status;
            if (status === 'resolved' && !ticket.resolvedAt) {
                ticket.resolvedAt = new Date();
            }
        }
        
        ticket.lastResponseAt = new Date();
        await ticket.save();

        // TODO: Send email notification to user about the reply

        res.json({
            success: true,
            message: 'Ticket updated successfully',
            data: ticket
        });
    } catch (error) {
        console.error('Add admin reply error:', error);
        res.status(500).json({ success: false, message: 'Failed to add reply' });
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

// Get ticket details (individual ticket)
exports.getTicketDetails = async (req, res) => {
    try {
        const ticketId = req.params.id;
        const ticket = await SupportTicket.findById(ticketId)
            .populate('userId', 'email username')
            .populate('assignedTo', 'email username')
            .populate('history.adminId', 'email username')
            .lean();

        if (!ticket) {
            return res.status(404).json({
                success: false,
                message: 'Ticket not found'
            });
        }

        // Check if user owns the ticket or is admin
        if (ticket.userId._id.toString() !== req.userId && !req.userRole?.includes('admin')) {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }

        res.json({
            success: true,
            data: ticket
        });
    } catch (error) {
        console.error('Get ticket details error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch ticket details'
        });
    }
};

// Add user reply to ticket
exports.addTicketReply = async (req, res) => {
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

        // Check if user owns the ticket
        if (ticket.userId.toString() !== req.userId) {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }

        ticket.history.push({
            from: 'user',
            message
        });

        ticket.lastResponseAt = new Date();
        ticket.status = 'open'; // Reopen if user replies
        await ticket.save();

        res.json({
            success: true,
            message: 'Reply added successfully',
            data: ticket
        });
    } catch (error) {
        console.error('Add ticket reply error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to add reply'
        });
    }
};

// Assign ticket to admin
exports.assignTicket = async (req, res) => {
    try {
        const { adminId } = req.body;
        const ticketId = req.params.id;

        // Verify admin exists
        const admin = await User.findById(adminId);
        if (!admin) {
            return res.status(404).json({
                success: false,
                message: 'Admin not found'
            });
        }

        const ticket = await SupportTicket.findByIdAndUpdate(
            ticketId,
            { 
                assignedTo: adminId,
                lastResponseAt: new Date()
            },
            { new: true }
        ).populate('assignedTo', 'email username');
        
        if (!ticket) {
            return res.status(404).json({
                success: false,
                message: 'Ticket not found'
            });
        }
        
        res.json({
            success: true,
            message: 'Ticket assigned successfully',
            data: ticket
        });
    } catch (error) {
        console.error('Assign ticket error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to assign ticket'
        });
    }
};

// Get active chat sessions (admin)
exports.getActiveChatSessions = async (req, res) => {
    try {
        const sessions = await ChatSession.find({ 
            status: { $in: ['waiting', 'active'] } 
        })
        .sort({ createdAt: -1 })
        .populate('userId', 'email username')
        .populate('assignedAdmin', 'email username')
        .lean();

        const formattedSessions = sessions.map(session => ({
            sessionId: session.sessionId,
            userName: session.userName,
            userEmail: session.userEmail,
            status: session.status,
            messageCount: session.messages.length,
            lastMessage: session.messages.length > 0 
                ? session.messages[session.messages.length - 1].text 
                : 'No messages yet',
            lastMessageAt: session.messages.length > 0
                ? session.messages[session.messages.length - 1].timestamp
                : session.startedAt,
            startedAt: session.startedAt,
            assignedAdmin: session.assignedAdmin
        }));

        res.json({
            success: true,
            data: formattedSessions
        });
    } catch (error) {
        console.error('Get active chat sessions error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch chat sessions'
        });
    }
};

// Get chat history for specific session
exports.getChatHistory = async (req, res) => {
    try {
        const { sessionId } = req.params;
        
        const session = await ChatSession.findOne({ sessionId })
            .populate('userId', 'email username')
            .populate('assignedAdmin', 'email username')
            .populate('messages.adminId', 'email username')
            .lean();

        if (!session) {
            return res.status(404).json({
                success: false,
                message: 'Chat session not found'
            });
        }

        res.json({
            success: true,
            data: {
                sessionInfo: {
                    sessionId: session.sessionId,
                    userName: session.userName,
                    userEmail: session.userEmail,
                    status: session.status,
                    startedAt: session.startedAt,
                    endedAt: session.endedAt,
                    assignedAdmin: session.assignedAdmin,
                    rating: session.rating,
                    feedback: session.feedback
                },
                messages: session.messages
            }
        });
    } catch (error) {
        console.error('Get chat history error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch chat history'
        });
    }
};