import React, { useState, useRef, useEffect } from 'react';
import {
    Box, 
    Typography, 
    TextField, 
    Button, 
    IconButton, 
    Avatar, 
    Badge,
    CircularProgress, 
    styled,
    InputAdornment,
    Chip
} from '@mui/material';
import { 
    Close as CloseIcon, 
    Send as SendIcon, 
    Circle as CircleIcon,
    AttachFile as AttachFileIcon,
    EmojiEmotions as EmojiIcon,
    Close as DeleteIcon
} from '@mui/icons-material';
import Picker from "emoji-picker-react";
import { useSocket } from '../../../hooks/useSocket';
import useAuth from '../../../hooks/useAuth';

// --- Styled Components (from your original) ---
const ChatWrapper = styled(Box)(({ theme }) => ({
    position: 'fixed',
    bottom: theme.spacing(2),
    right: theme.spacing(2),
    zIndex: 1500,
    display: 'flex',
    flexDirection: 'column'
}));

const ChatContainer = styled(Box)(({ theme }) => ({
    backgroundColor: theme.palette.background.paper,
    borderRadius: theme.spacing(2),
    boxShadow: theme.shadows[24],
    width: '100%',
    maxWidth: 450,
    height: 600,
    maxHeight: '90vh',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden'
}));

const ChatHeader = styled(Box)(({ theme }) => ({
    background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
    color: 'white',
    padding: theme.spacing(2),
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between'
}));

const ChatMessages = styled(Box)(({ theme }) => ({
    flex: 1,
    padding: theme.spacing(2),
    overflowY: 'auto',
    backgroundColor: theme.palette.grey[50],
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(2)
}));

const ChatInput = styled(Box)(({ theme }) => ({
    padding: theme.spacing(1.5, 2),
    borderTop: `1px solid ${theme.palette.grey[200]}`,
    backgroundColor: theme.palette.background.paper,
    position: 'relative'
}));

const MessageBubble = styled(Box)(({ theme, isUser }) => ({
    maxWidth: '80%',
    padding: theme.spacing(1.5, 2),
    borderRadius: theme.spacing(2),
    alignSelf: isUser ? 'flex-end' : 'flex-start',
    backgroundColor: isUser ? theme.palette.primary.main : theme.palette.background.paper,
    color: isUser ? 'white' : theme.palette.text.primary,
    boxShadow: theme.shadows[1],
    wordBreak: 'break-word'
}));

// --- LiveChat Component ---
const LiveChat = ({ isOpen, onClose, agentInitial = "S" }) => {
    const { socket, isConnected } = useSocket();
    const { user } = useAuth();

    // --- Refs ---
    const messagesEndRef = useRef(null);
    const fileInputRef = useRef(null);
    const emojiPickerRef = useRef(null);
    const emojiButtonRef = useRef(null);

    // --- State Management ---
    const [chatState, setChatState] = useState('pre-chat');
    const [guestName, setGuestName] = useState('');
    const [message, setMessage] = useState('');
    const [messages, setMessages] = useState([]);
    const [sessionId, setSessionId] = useState(null);
    const [agent, setAgent] = useState({ name: 'Support Agent', isTyping: false });
    const [showEmoji, setShowEmoji] = useState(false);
    const [attachments, setAttachments] = useState([]);

    // --- Effects ---
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (
                emojiPickerRef.current && !emojiPickerRef.current.contains(event.target) &&
                emojiButtonRef.current && !emojiButtonRef.current.contains(event.target)
            ) {
                setShowEmoji(false);
            }
        };
        if (showEmoji) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [showEmoji]);

    useEffect(() => {
        console.log("socket: ", socket);
        if (!socket) return;
        
        const handleSessionStarted = (data) => {
            setSessionId(data.sessionId);
            setChatState('waiting');
            setMessages([{ from: 'system', message: 'You are connected. An agent will be with you shortly.' }]);
        };
        const handleNewMessage = (newMessage) => {
            setMessages((prev) => [...prev, newMessage]);
        };
        const handleAdminJoined = (data) => {
            setAgent((prev) => ({ ...prev, name: data.adminName }));
            setChatState('active');
            setMessages((prev) => [...prev, { from: 'system', message: `${data.adminName} has joined the chat.` }]);
        };
        const handleError = (data) => {
            alert(`Chat Error: ${data.message}`);
            setChatState('pre-chat');
        };

        socket.on('chat:session_started', handleSessionStarted);
        socket.on('chat:new_message', handleNewMessage);
        socket.on('admin:joined', handleAdminJoined);
        socket.on('chat:error', handleError);

        return () => {
            socket.off('chat:session_started', handleSessionStarted);
            socket.off('chat:new_message', handleNewMessage);
            socket.off('admin:joined', handleAdminJoined);
            socket.off('chat:error', handleError);
        };
    }, [socket]);

    // --- Handlers ---
    const handleStartChat = (e) => {
        e.preventDefault();
        if (!isConnected || !message.trim()) return;
        const finalUserName = user?.name || guestName;
        if (!finalUserName.trim()) return alert('Please enter your name.');
        
        socket.emit('user:start_chat', { name: finalUserName, message });
    };

    const handleSendMessage = () => {
        if ((!message.trim() && attachments.length === 0) || !sessionId) return;
        
        // Note: File attachment logic requires backend support for uploads.
        // This example sends the text message and clears the files.
        const newMessage = { from: 'user', message };
        socket.emit('chat:message', { sessionId, ...newMessage });
        setMessages((prev) => [...prev, newMessage]);
        setMessage('');
        setAttachments([]);
        setShowEmoji(false);
    };
    
    const handleEmojiClick = (emojiObject) => {
        setMessage((prev) => prev + emojiObject.emoji);
    };

    const handleFileChange = (e) => {
        setAttachments(Array.from(e.target.files));
    };

    const handleRemoveAttachment = (fileToRemove) => {
        setAttachments(attachments.filter(file => file !== fileToRemove));
    };
    
    // --- RENDER LOGIC ---
    if (!isOpen) return null;

    // Pre-Chat Form
    if (chatState === 'pre-chat') {
        return (
            <ChatWrapper>
                <ChatContainer as="form" onSubmit={handleStartChat}>
                    <ChatHeader>
                        <Typography variant="h6">Start a Chat</Typography>
                        <IconButton onClick={onClose} sx={{ color: 'white' }}><CloseIcon /></IconButton>
                    </ChatHeader>
                    <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
                        {!user && (
                            <TextField label="Your Name" value={guestName} onChange={(e) => setGuestName(e.target.value)} required />
                        )}
                        <TextField label="How can we help?" value={message} onChange={(e) => setMessage(e.target.value)} required multiline rows={4} />
                        <Button type="submit" variant="contained" disabled={!isConnected}>
                            {isConnected ? 'Start Chat' : <CircularProgress size={24} />}
                        </Button>
                    </Box>
                </ChatContainer>
            </ChatWrapper>
        );
    }
    
    // Main Chat Window
    return (
        <ChatWrapper>
            <ChatContainer>
                <ChatHeader>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Badge overlap="circular" anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }} badgeContent={<CircleIcon sx={{ fontSize: 12, color: 'success.main' }} />}>
                            <Avatar sx={{ width: 40, height: 40, bgcolor: 'primary.light' }}>{agentInitial}</Avatar>
                        </Badge>
                        <Box>
                            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>{chatState === 'active' ? agent.name : 'Live Support'}</Typography>
                            <Typography variant="caption">{chatState === 'active' ? 'Online' : 'Waiting for agent...'}</Typography>
                        </Box>
                    </Box>
                    <IconButton onClick={onClose} sx={{ color: 'white' }}><CloseIcon /></IconButton>
                </ChatHeader>

                <ChatMessages>
                    {messages.map((msg, index) =>
                        msg.from === 'system' ? (
                            <Typography key={index} variant="caption" align="center" color="text.secondary">{msg.message}</Typography>
                        ) : (
                            <MessageBubble key={index} isUser={msg.from === 'user'}>
                                <Typography variant="body2">{msg.message}</Typography>
                            </MessageBubble>
                        )
                    )}
                    <div ref={messagesEndRef} />
                </ChatMessages>

                <ChatInput>
                    {attachments.length > 0 && (
                        <Box sx={{ mb: 1, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                            {attachments.map((file, index) => (
                                <Chip key={index} label={file.name} onDelete={() => handleRemoveAttachment(file)} deleteIcon={<DeleteIcon />} size="small" />
                            ))}
                        </Box>
                    )}
                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                        <TextField
                            fullWidth multiline maxRows={3} placeholder="Type your message..."
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            onKeyPress={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } }}
                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
                            InputProps={{
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <input ref={fileInputRef} type="file" hidden multiple onChange={handleFileChange} />
                                        <IconButton size="small" onClick={() => fileInputRef.current.click()}><AttachFileIcon fontSize="small" /></IconButton>
                                        <IconButton ref={emojiButtonRef} size="small" onClick={() => setShowEmoji(!showEmoji)}><EmojiIcon fontSize="small" /></IconButton>
                                    </InputAdornment>
                                )
                            }}
                        />
                        <IconButton
                            onClick={handleSendMessage}
                            disabled={!message.trim() && attachments.length === 0}
                            sx={{ bgcolor: 'primary.main', color: 'white', '&:hover': { bgcolor: 'primary.dark' }, '&:disabled': { bgcolor: 'grey.300' } }}
                        >
                            <SendIcon />
                        </IconButton>
                    </Box>
                    {showEmoji && (
                        <Box ref={emojiPickerRef} sx={{ position: 'absolute', bottom: '100%', right: 0, mb: 1, zIndex: 1600 }}>
                            <Picker onEmojiClick={handleEmojiClick} />
                        </Box>
                    )}
                </ChatInput>
            </ChatContainer>
        </ChatWrapper>
    );
};

export default LiveChat;