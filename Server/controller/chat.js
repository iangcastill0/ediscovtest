const ChatSession = require('../models/chat');

// This variable will hold the socket.io instance passed from server.js
let io;

// A set to keep track of currently connected admins
const activeAdmins = new Set();

/**
 * Initializes the chat service and sets up all the real-time event listeners.
 * This function is called once in server.js.
 * @param {object} socketIo - The socket.io server instance.
 */
exports.initChatService = (socketIo) => {
    io = socketIo;

    // Listen for new connections from clients (users or admins)
    io.on('connection', (socket) => {
        console.log(`Socket connected: ${socket.id}`);

        // --- ADMIN EVENTS ---

        // Event for when an admin's dashboard connects
        socket.on('admin:connect', async () => {
            console.log(`Admin connected: ${socket.id}`);
            socket.join('admin_room'); // Admins join a special room to receive notifications
            activeAdmins.add(socket.id);
            await emitActiveChats(); // Send the list of current chats to the newly connected admin
        });

        // Event for when an admin clicks on a chat to join it
        socket.on('admin:join_chat', async ({ sessionId }) => {
            try {
                const session = await ChatSession.findById(sessionId);
                if (!session) {
                    return socket.emit('chat:error', { message: 'Chat session not found.' });
                }

                socket.join(sessionId); // Admin joins the room for this specific chat
                session.adminSocketId = socket.id;
                session.status = 'active';
                await session.save();

                // Send the full chat history to the admin
                socket.emit('chat:history', { sessionId, history: session.history });
                // Notify the user that an admin has connected
                io.to(session.userSocketId).emit('admin:joined', { adminName: 'Support Agent' });
                
                await emitActiveChats(); // Update the chat list for all other admins
            } catch (error) {
                console.error(`Admin failed to join chat ${sessionId}:`, error);
            }
        });

        // --- USER EVENTS ---

        // Event for when a user starts a new chat session from the LiveChat widget
        socket.on('user:start_chat', async (data) => {
            try {
                // Create and save a new chat session in the database
                const newSession = new ChatSession({
                    userSocketId: socket.id,
                    guestName: data.name,
                    history: [{ from: 'user', message: data.message }]
                });
                await newSession.save();

                socket.join(newSession._id.toString()); // User joins a room specific to their chat
                // Let the user's frontend know the session has started and what the ID is
                io.to(socket.id).emit('chat:session_started', { sessionId: newSession._id });
                
                await emitActiveChats(); // Notify all admins of the new waiting user
            } catch (error) {
                console.error('Failed to start chat session:', error);
                socket.emit('chat:error', { message: 'Could not start your chat. Please try again.' });
            }
        });

        // --- SHARED EVENTS ---

        // Event for when a message is sent by either a user or an admin
        socket.on('chat:message', async ({ sessionId, from, message }) => {
            try {
                const session = await ChatSession.findById(sessionId);
                if (!session) return;

                const newMessage = { from, message };
                session.history.push(newMessage);
                await session.save();

                // Broadcast the new message to everyone in the room (the user and the admin)
                io.to(sessionId).emit('chat:new_message', newMessage);
            } catch (error) {
                console.error(`Failed to save message for session ${sessionId}:`, error);
            }
        });

        // Event for when any socket disconnects
        socket.on('disconnect', async () => {
            console.log(`Socket disconnected: ${socket.id}`);
            if (activeAdmins.has(socket.id)) {
                activeAdmins.delete(socket.id);
            } else {
                // If a user disconnects, find their active session and close it
                const session = await ChatSession.findOne({ userSocketId: socket.id, status: { $ne: 'closed' } });
                if (session) {
                    session.status = 'closed';
                    await session.save();
                    // Notify the admin in the chat that the user has left
                    io.to(session._id.toString()).emit('user:disconnected');
                    await emitActiveChats(); // Update admin dashboards
                }
            }
        });
    });
};

/**
 * Fetches all waiting and active chats and emits them to all connected admins.
 */
const emitActiveChats = async () => {
    try {
        const waiting = await ChatSession.find({ status: 'waiting' }).select('guestName history').sort({ createdAt: 1 });
        const active = await ChatSession.find({ status: 'active' }).select('guestName history').sort({ createdAt: 1 });
        io.to('admin_room').emit('admin:active_chats', { waiting, active });
    } catch (error) {
        console.error('Failed to fetch and emit active chats:', error);
    }
};
