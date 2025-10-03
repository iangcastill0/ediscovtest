import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Box, Typography, List, ListItemButton, ListItemText, Paper, TextField, IconButton, Divider, useTheme, Card, Chip, CircularProgress } from '@mui/material';
import { Send as SendIcon } from '@mui/icons-material';
import { useSocket } from '../../../../hooks/useSocket';


export const AdminChat = () => {
    const theme = useTheme();
    const { socket, isConnected } = useSocket();
    
    // State for chats, messages, and UI
    const [waitingChats, setWaitingChats] = useState([]);
    const [activeChats, setActiveChats] = useState([]);
    const [selectedChat, setSelectedChat] = useState(null);
    const [messages, setMessages] = useState([]);
    const [reply, setReply] = useState('');
    const [isLoadingChat, setIsLoadingChat] = useState(false);
    const messagesEndRef = useRef(null);
    
    // Effect for Socket.IO event listeners
    useEffect(() => {
        if (!socket || !isConnected) return;
        
        // Announce that this client is an admin
        socket.emit('admin:connect');
        
        // Listener for the list of waiting and active chats
        const handleActiveChats = ({ waiting, active }) => {
            setWaitingChats(waiting || []);
            setActiveChats(active || []);
        };

        // Listener for the full message history of a selected chat
        const handleChatHistory = ({ sessionId, history }) => {
            if (selectedChat?._id === sessionId) {
                setMessages(history || []);
                setIsLoadingChat(false);
            }
        };

        // Listener for new incoming messages
        const handleNewMessage = (newMessage) => {
            // Only add the message if it belongs to the currently viewed chat
            if (selectedChat && newMessage.sessionId === selectedChat._id) {
                setMessages(prev => [...prev, newMessage]);
            }
        };
        
        socket.on('admin:active_chats', handleActiveChats);
        socket.on('chat:history', handleChatHistory);
        socket.on('chat:new_message', handleNewMessage);
        
        // Cleanup listeners on component unmount
        return () => {
            socket.off('admin:active_chats', handleActiveChats);
            socket.off('chat:history', handleChatHistory);
            socket.off('chat:new_message', handleNewMessage);
        };
    }, [socket, isConnected, selectedChat]);
    
    // Scroll to the bottom of the message list when new messages are added
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);
    
    // Handler for selecting a chat from the list
    const handleSelectChat = useCallback((chat) => {
        if (selectedChat?._id === chat._id) return;
        
        setSelectedChat(chat);
        setMessages([]); // Clear previous messages
        setIsLoadingChat(true);
        
        // Tell the server this admin is joining this specific chat
        if (socket) {
            socket.emit('admin:join_chat', { sessionId: chat._id });
        }
    }, [socket, selectedChat]);
    
    // Handler for sending a reply
    const handleSendReply = () => {
        if (reply.trim() && selectedChat && isConnected) {
            const newMessage = { from: 'admin', message: reply };
            
            // Emit the message to the server
            socket.emit('chat:message', { sessionId: selectedChat._id, ...newMessage });
            
            // Optimistically update the UI with the new message
            setMessages(prev => [...prev, newMessage]);
            setReply('');
        }
    };

    const allChats = [...waitingChats, ...activeChats];

    return (
        <Card component={Paper} elevation={3} sx={{ mt: 4 }}>
            <Typography variant="h5" sx={{ p: 2, fontWeight: 'bold' }}>
                Live Chat Dashboard
            </Typography>
            <Divider />
            <Box sx={{ display: 'flex', height: '70vh' }}>
                <Box sx={{ width: '30%', borderRight: `1px solid ${theme.palette.divider}`, overflowY: 'auto' }}>
                    <List component="nav">
                        {allChats.length > 0 ? allChats.map((chat) => (
                            <ListItemButton
                                key={chat._id}
                                onClick={() => handleSelectChat(chat)}
                                selected={selectedChat?._id === chat._id}
                            >
                                <ListItemText 
                                    primary={chat.guestName} 
                                    secondary={chat.history?.length > 0 ? chat.history[chat.history.length - 1].message : 'New chat'}
                                    secondaryTypographyProps={{ noWrap: true, variant: 'body2' }}
                                />
                                <Chip 
                                    label={chat.status} 
                                    size="small" 
                                    color={chat.status === 'waiting' ? 'warning' : 'success'} 
                                    sx={{ ml: 1 }}
                                />
                            </ListItemButton>
                        )) : (
                            <Typography sx={{ p: 2, color: 'text.secondary' }}>
                                No active chats.
                            </Typography>
                        )}
                    </List>
                </Box>
                <Box sx={{ width: '70%', display: 'flex', flexDirection: 'column' }}>
                    {selectedChat ? (
                        <>
                            <Box sx={{ flex: 1, p: 2, overflowY: 'auto', position: 'relative' }}>
                                {isLoadingChat ? (
                                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                                        <CircularProgress />
                                    </Box>
                                ) : (
                                    messages.map((msg, index) => (
                                        <Box 
                                            key={index} 
                                            sx={{ mb: 2, display: 'flex', justifyContent: msg.from === 'admin' ? 'flex-end' : 'flex-start' }}
                                        >
                                            <Paper 
                                                elevation={1} 
                                                sx={{ 
                                                    p: 1.5, 
                                                    borderRadius: 2, 
                                                    bgcolor: msg.from === 'admin' ? 'primary.light' : 'grey.200',
                                                    color: msg.from === 'admin' ? 'primary.contrastText' : 'inherit',
                                                    maxWidth: '70%' 
                                                }}
                                            >
                                                <Typography variant="body1">{msg.message}</Typography>
                                            </Paper>
                                        </Box>
                                    ))
                                )}
                                <div ref={messagesEndRef} />
                            </Box>
                            <Divider />
                            <Box sx={{ p: 1, display: 'flex', alignItems: 'center', bgcolor: 'grey.50' }}>
                                <TextField 
                                    fullWidth 
                                    size="small" 
                                    variant="outlined" 
                                    placeholder="Type your reply..." 
                                    value={reply} 
                                    onChange={(e) => setReply(e.target.value)} 
                                    onKeyPress={(e) => e.key === 'Enter' && handleSendReply()} 
                                />
                                <IconButton color="primary" onClick={handleSendReply} disabled={!reply.trim()}>
                                    <SendIcon />
                                </IconButton>
                            </Box>
                        </>
                    ) : (
                        <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'grey.100' }}>
                            <Typography color="text.secondary">Select a chat to begin</Typography>
                        </Box>
                    )}
                </Box>
            </Box>
        </Card>
    );
};