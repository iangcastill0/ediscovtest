import React, { useState, useEffect, useMemo } from 'react';
import {
    Box,
    Container,
    Typography,
    Grid,
    Card,
    CardContent,
    Button,
    TextField,
    InputAdornment,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    Chip,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    useTheme,
    styled,
    Alert,
    CircularProgress,
    Snackbar
} from '@mui/material';
import {
    Search as SearchIcon,
    Chat as MessageCircleIcon,
    Phone as PhoneIcon,
    Email as MailIcon,
    AccessTime as ClockIcon,
    CheckCircle as CheckCircleIcon,
    HelpOutline as HelpCircleIcon,
    ExpandMore as ExpandMoreIcon,
    AttachFile as AttachFileIcon
} from '@mui/icons-material';
import axios from 'utils/axios';
import LiveChat from './LiveChat';
import { useSupportSettings } from '../../../contexts/SupportSettingsContext';

const StyledCard = styled(Card)(({ theme }) => ({
    borderRadius: theme.spacing(2),
    boxShadow: theme.shadows[1],
    border: `1px solid ${theme.palette.grey[100]}`,
    transition: 'box-shadow 0.3s ease',
    '&:hover': {
        boxShadow: theme.shadows[4]
    }
}));

const IconWrapper = styled(Box)(({ theme, color }) => ({
    backgroundColor: theme.palette[color].light,
    padding: theme.spacing(1.5),
    borderRadius: theme.spacing(1),
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
}));

export const Support = () => {
    const theme = useTheme();
    const [activeIndex, setActiveIndex] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        subject: '',
        priority: 'medium',
        category: 'general',
        message: '',
    });
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // New state for backend integration
    const [userTickets, setUserTickets] = useState([]);
    const [selectedTicket, setSelectedTicket] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [attachments, setAttachments] = useState([]);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

    const { chatHours } = useSupportSettings();

    // Fetch user tickets from backend
    const fetchUserTickets = async () => {
        try {
            setLoading(true);
            const response = await axios.get('/support/tickets');
            console.log("ticketResponse=>", response);
            if (response.data.success) {
                setUserTickets(response.data.data);
            } else {
                throw new Error(response.data.message || 'Failed to fetch tickets');
            }
        } catch (error) {
            console.error('Error fetching tickets:', error);
            setError(error.response?.data?.message || 'Failed to load support tickets');
            setSnackbar({
                open: true,
                message: 'Failed to load support tickets',
                severity: 'error'
            });
        } finally {
            setLoading(false);
        }
    };

    // Load tickets on component mount
    useEffect(() => {
        fetchUserTickets();
    }, []);

    const toggleFAQ = (index) => {
        setActiveIndex(activeIndex === index ? null : index);
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData((prevData) => ({
            ...prevData,
            [name]: value,
        }));
    };

    const handleFileChange = (e) => {
        const files = Array.from(e.target.files);
        setAttachments(files);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            // Create FormData for file upload support
            const submitData = new FormData();
            submitData.append('subject', formData.subject);
            submitData.append('message', formData.message);
            submitData.append('priority', formData.priority);
            submitData.append('category', formData.category);
            
            // Add files if any
            attachments.forEach((file, index) => {
                submitData.append('attachments', file);
            });

            const response = await axios.post('/support/tickets', submitData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });

            if (response.data.success) {
                setIsSubmitted(true);
                setSnackbar({
                    open: true,
                    message: 'Support ticket created successfully!',
                    severity: 'success'
                });

                // Reset form after 3 seconds
                setTimeout(() => {
                    setFormData({ 
                        name: '', 
                        email: '', 
                        subject: '', 
                        priority: 'medium', 
                        category: 'general',
                        message: '' 
                    });
                    setAttachments([]);
                    setIsSubmitted(false);
                    // Refresh tickets list
                    fetchUserTickets();
                }, 3000);
            } else {
                throw new Error(response.data.message || 'Failed to create ticket');
            }
        } catch (error) {
            console.error('Error creating ticket:', error);
            setSnackbar({
                open: true,
                message: error.response?.data?.message || 'Failed to create support ticket',
                severity: 'error'
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleTicketReply = async (ticketId, message) => {
        try {
            const response = await axios.post(`/support/tickets/${ticketId}/reply`, {
                message
            });

            if (response.data.success) {
                setSnackbar({
                    open: true,
                    message: 'Reply sent successfully!',
                    severity: 'success'
                });
                // Refresh tickets to show the new reply
                fetchUserTickets();
            }
        } catch (error) {
            console.error('Error sending reply:', error);
            setSnackbar({
                open: true,
                message: 'Failed to send reply',
                severity: 'error'
            });
        }
    };

    const isWithinChatHours = useMemo(() => {
        try {
            const now = new Date();
            const options = {
                timeZone: 'America/New_York',
                hour: '2-digit',
                hour12: false
            };

            const nyHourString = new Intl.DateTimeFormat('en-US', options).format(now);
            let nyHour = parseInt(nyHourString, 10);

            if (nyHour === 24) {
                nyHour = 0;
            }

            return nyHour >= chatHours.start && nyHour < chatHours.end;

        } catch (error) {
            console.error("Error calculating timezone:", error);
            const utcHour = new Date().getUTCHours();
            const estHour = (utcHour - 4 + 24) % 24;
            return estHour >= chatHours.start && estHour < chatHours.end;
        }
    }, [chatHours]);

    const handleOpenChat = () => {
        if (isWithinChatHours) {
            setIsChatOpen(true);
        } else {
            alert(`Live chat is available only between ${chatHours.start}:00 and ${chatHours.end}:00 ET (America/New_York). Please send us an email instead.`);
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'open': return 'success';
            case 'pending': return 'warning';
            case 'resolved': return 'default';
            default: return 'default';
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <Box sx={{
            minHeight: '100vh',
            background: `linear-gradient(135deg, ${theme.palette.primary.light} 0%, ${theme.palette.common.white} 50%, ${theme.palette.secondary.light} 100%)`,
            pb: 8
        }}>
            {/* Header */}
            <Box sx={{
                bgcolor: 'background.paper',
                boxShadow: 1,
                borderBottom: `1px solid ${theme.palette.grey[100]}`,
                py: { xs: 6, md: 10 },
                position: 'relative',
                overflow: 'hidden'
            }}>
                <Box sx={{
                    position: 'absolute',
                    top: 0,
                    right: 0,
                    width: '50%',
                    height: '100%',
                    background: `linear-gradient(135deg, ${theme.palette.primary.light}15 0%, ${theme.palette.secondary.light}10 100%)`,
                    clipPath: 'polygon(30% 0%, 100% 0%, 100% 100%, 0% 100%)',
                    zIndex: 0
                }} />

                <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
                    <Grid container spacing={4} alignItems="center">
                        <Grid item xs={12} md={8}>
                            <Box>
                                <Chip
                                    label="24/7 Support Available"
                                    color="primary"
                                    size="small"
                                    sx={{
                                        bgcolor: 'primary.light',
                                        color: 'primary.dark',
                                        fontWeight: 600,
                                        mb: 1
                                    }}
                                />
                                <Typography
                                    variant="h2"
                                    component="h1"
                                    gutterBottom
                                    sx={{
                                        fontWeight: 800,
                                        color: 'grey.900',
                                        fontSize: { xs: '2.5rem', md: '3.5rem' },
                                        lineHeight: 1.1,
                                        mb: 2
                                    }}
                                >
                                    Get Help When You Need It
                                </Typography>
                                <Typography variant="h5" sx={{ color: 'grey.700', fontWeight: 400, lineHeight: 1.4, mb: 3 }}>
                                    Expert support
                                </Typography>
                                <Typography variant="body1" sx={{ color: 'grey.600', fontSize: '1.1rem', lineHeight: 1.6, maxWidth: 500 }}>
                                    From onboarding to advanced features, our dedicated support team ensures you get the most out of your platform investment.
                                </Typography>
                                <Box sx={{ display: 'flex', gap: 4, mt: 4, flexWrap: 'wrap' }}>
                                    <Box>
                                        <Typography variant="h4" sx={{ fontWeight: 700, color: 'primary.main' }}>
                                            &lt;2min
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            Avg. response time
                                        </Typography>
                                    </Box>
                                    <Box>
                                        <Typography variant="h4" sx={{ fontWeight: 700, color: 'success.main' }}>
                                            99.9%
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            Customer satisfaction
                                        </Typography>
                                    </Box>
                                    <Box>
                                        <Typography variant="h4" sx={{ fontWeight: 700, color: 'secondary.main' }}>
                                            24/7
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            Support availability
                                        </Typography>
                                    </Box>
                                </Box>
                            </Box>
                        </Grid>
                        <Grid item xs={12} md={4}>
                            <Box sx={{ display: { xs: 'none', md: 'block' }, textAlign: 'center' }}>
                                <Box sx={{
                                    width: 200,
                                    height: 200,
                                    mx: 'auto',
                                    background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                                    borderRadius: '50%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    position: 'relative',
                                    boxShadow: theme.shadows[8]
                                }}>
                                    <HelpCircleIcon sx={{ fontSize: 80, color: 'white', filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.2))' }} />
                                </Box>
                            </Box>
                        </Grid>
                    </Grid>
                </Container>
            </Box>

            <Container maxWidth="lg" sx={{ py: 8 }}>
                {/* Quick Contact Options */}
                <Grid container spacing={3} sx={{ mb: 8 }}>
                    <Grid item xs={12} md={4}>
                        <StyledCard>
                            <CardContent>
                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                    <IconWrapper color="primary"><MessageCircleIcon color="primary" /></IconWrapper>
                                    <Box sx={{ ml: 2 }}>
                                        <Typography variant="h6" component="h3">Live Chat</Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            Available {chatHours.start}:00 - {chatHours.end}:00 ET
                                        </Typography>
                                    </Box>
                                </Box>
                                <Button 
                                    fullWidth 
                                    variant="contained" 
                                    color="primary" 
                                    sx={{ mt: 1 }} 
                                    onClick={handleOpenChat} 
                                    disabled={!isWithinChatHours}
                                >
                                    {isWithinChatHours ? "Start Chat" : "Chat Closed"}
                                </Button>
                            </CardContent>
                        </StyledCard>
                    </Grid>
                    <Grid item xs={12} md={4}>
                        <StyledCard>
                            <CardContent>
                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                    <IconWrapper color="success"><PhoneIcon color="success" /></IconWrapper>
                                    <Box sx={{ ml: 2 }}>
                                        <Typography variant="h6" component="h3">Call Us</Typography>
                                        <Typography variant="body2" color="text.secondary">1-XXX-XXX-XXXX</Typography>
                                    </Box>
                                </Box>
                                <Button component="a" href="tel:1-XXX-XXX-XXXX" fullWidth variant="contained" color="success" sx={{ mt: 1 }}>
                                    Call Now
                                </Button>
                            </CardContent>
                        </StyledCard>
                    </Grid>
                    <Grid item xs={12} md={4}>
                        <StyledCard>
                            <CardContent>
                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                    <IconWrapper color="secondary"><MailIcon color="secondary" /></IconWrapper>
                                    <Box sx={{ ml: 2 }}>
                                        <Typography variant="h6" component="h3">Email</Typography>
                                        <Typography variant="body2" color="text.secondary">24hr response time</Typography>
                                    </Box>
                                </Box>
                                <Button component="a" href="mailto:support@yourcompany.com" fullWidth variant="contained" color="secondary" sx={{ mt: 1 }}>
                                    Send Email
                                </Button>
                            </CardContent>
                        </StyledCard>
                    </Grid>
                </Grid>

                {/* My Tickets Section */}
                <Box sx={{ mb: 8 }}>
                    <Typography variant="h4" component="h2" gutterBottom sx={{ fontWeight: 700 }}>
                        My Support Tickets
                    </Typography>
                    
                    {loading ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                            <CircularProgress />
                        </Box>
                    ) : error ? (
                        <Alert severity="error" sx={{ mb: 2 }}>
                            {error}
                        </Alert>
                    ) : userTickets.length > 0 ? (
                        userTickets.map((ticket) => (
                            <Accordion 
                                key={ticket._id} 
                                expanded={selectedTicket === ticket._id} 
                                onChange={() => setSelectedTicket(selectedTicket === ticket._id ? null : ticket._id)}
                            >
                                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', gap: 2 }}>
                                        <Typography sx={{ flexShrink: 0, fontWeight: 500, color: 'primary.main' }}>
                                            {ticket.ticketId}
                                        </Typography>
                                        <Typography sx={{ color: 'text.secondary', flexGrow: 1 }}>
                                            {ticket.subject}
                                        </Typography>
                                        <Chip 
                                            label={ticket.status} 
                                            color={getStatusColor(ticket.status)} 
                                            size="small" 
                                            sx={{ textTransform: 'capitalize' }}
                                        />
                                        <Typography variant="caption" color="text.secondary">
                                            {formatDate(ticket.createdAt)}
                                        </Typography>
                                    </Box>
                                </AccordionSummary>
                                <AccordionDetails sx={{ borderTop: `1px solid ${theme.palette.divider}`, pt: 2 }}>
                                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                        {ticket.history.map((entry, index) => (
                                            <Box
                                                key={index}
                                                sx={{
                                                    p: 2,
                                                    borderRadius: 2,
                                                    maxWidth: '80%',
                                                    bgcolor: entry.from === 'admin' ? 'primary.light' : 'grey.100',
                                                    alignSelf: entry.from === 'admin' ? 'flex-start' : 'flex-end',
                                                }}
                                            >
                                                <Typography variant="body2" sx={{ 
                                                    fontWeight: 'bold', 
                                                    color: entry.from === 'admin' ? 'primary.dark' : 'text.primary',
                                                    mb: 1
                                                }}>
                                                    {entry.from === 'admin' ? 'Support Team' : 'You'}
                                                    <Typography component="span" variant="caption" sx={{ ml: 1, fontWeight: 'normal' }}>
                                                        {formatDate(entry.timestamp)}
                                                    </Typography>
                                                </Typography>
                                                <Typography variant="body1">{entry.message}</Typography>
                                            </Box>
                                        ))}
                                        
                                        {/* Show attachments if any */}
                                        {ticket.attachments && ticket.attachments.length > 0 && (
                                            <Box sx={{ mt: 2 }}>
                                                <Typography variant="subtitle2" gutterBottom>Attachments:</Typography>
                                                {ticket.attachments.map((file, index) => (
                                                    <Chip
                                                        key={index}
                                                        icon={<AttachFileIcon />}
                                                        label={file.originalName}
                                                        variant="outlined"
                                                        size="small"
                                                        sx={{ mr: 1, mb: 1 }}
                                                    />
                                                ))}
                                            </Box>
                                        )}
                                    </Box>
                                </AccordionDetails>
                            </Accordion>
                        ))
                    ) : (
                        <Typography>You have no support tickets.</Typography>
                    )}
                </Box>

                {/* Contact Form */}
                <StyledCard id="contact-form" sx={{ p: { xs: 3, md: 6 } }}>
                    <Box sx={{ maxWidth: 800, mx: 'auto' }}>
                        <Box sx={{ textAlign: 'center', mb: 4 }}>
                            <Typography variant="h4" component="h2" gutterBottom sx={{ fontWeight: 700 }}>
                                Still need help?
                            </Typography>
                            <Typography variant="body1" color="text.secondary">
                                Can't find what you're looking for? Send us a detailed message and we'll get back to you within 24 hours.
                            </Typography>
                        </Box>

                        {isSubmitted ? (
                            <Box sx={{ textAlign: 'center', py: 6 }}>
                                <Box sx={{
                                    bgcolor: 'success.light',
                                    width: 80,
                                    height: 80,
                                    borderRadius: '50%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    mx: 'auto',
                                    mb: 3
                                }}>
                                    <CheckCircleIcon sx={{ fontSize: 40, color: 'success.main' }} />
                                </Box>
                                <Typography variant="h5" gutterBottom>Ticket Created!</Typography>
                                <Typography variant="body1" color="text.secondary">
                                    Thank you for contacting us. We'll get back to you shortly.
                                </Typography>
                            </Box>
                        ) : (
                            <Box component="form" onSubmit={handleSubmit} sx={{ '& .MuiFormControl-root': { mb: 2 } }}>
                                <Grid container spacing={3}>
                                    <Grid item xs={12} md={6}>
                                        <TextField 
                                            fullWidth 
                                            label="Subject *" 
                                            id="subject" 
                                            name="subject" 
                                            value={formData.subject} 
                                            onChange={handleInputChange} 
                                            required 
                                        />
                                    </Grid>
                                    <Grid item xs={12} md={6}>
                                        <FormControl fullWidth>
                                            <InputLabel id="priority-label">Priority Level</InputLabel>
                                            <Select 
                                                labelId="priority-label" 
                                                id="priority" 
                                                name="priority" 
                                                value={formData.priority} 
                                                onChange={handleInputChange} 
                                                label="Priority Level"
                                            >
                                                <MenuItem value="low">Low - General inquiry</MenuItem>
                                                <MenuItem value="medium">Medium - Standard issue</MenuItem>
                                                <MenuItem value="high">High - Urgent problem</MenuItem>
                                            </Select>
                                        </FormControl>
                                    </Grid>
                                    <Grid item xs={12} md={6}>
                                        <FormControl fullWidth>
                                            <InputLabel id="category-label">Category</InputLabel>
                                            <Select 
                                                labelId="category-label" 
                                                id="category" 
                                                name="category" 
                                                value={formData.category} 
                                                onChange={handleInputChange} 
                                                label="Category"
                                            >
                                                <MenuItem value="general">General</MenuItem>
                                                <MenuItem value="technical">Technical</MenuItem>
                                                <MenuItem value="billing">Billing</MenuItem>
                                                <MenuItem value="feature">Feature Request</MenuItem>
                                            </Select>
                                        </FormControl>
                                    </Grid>
                                    <Grid item xs={12} md={6}>
                                        <Button
                                            variant="outlined"
                                            component="label"
                                            fullWidth
                                            startIcon={<AttachFileIcon />}
                                        >
                                            Attach Files ({attachments.length})
                                            <input
                                                type="file"
                                                hidden
                                                multiple
                                                onChange={handleFileChange}
                                                accept=".jpg,.jpeg,.png,.pdf,.doc,.docx,.txt"
                                            />
                                        </Button>
                                    </Grid>
                                    <Grid item xs={12}>
                                        <TextField 
                                            fullWidth 
                                            multiline 
                                            rows={6} 
                                            label="Message *" 
                                            id="message" 
                                            name="message" 
                                            value={formData.message} 
                                            onChange={handleInputChange} 
                                            required 
                                        />
                                    </Grid>
                                </Grid>
                                
                                {/* Show attached files */}
                                {attachments.length > 0 && (
                                    <Box sx={{ mt: 2 }}>
                                        <Typography variant="subtitle2" gutterBottom>Attached files:</Typography>
                                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                            {attachments.map((file, index) => (
                                                <Chip
                                                    key={index}
                                                    label={file.name}
                                                    onDelete={() => setAttachments(attachments.filter((_, i) => i !== index))}
                                                    size="small"
                                                />
                                            ))}
                                        </Box>
                                    </Box>
                                )}

                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 4, flexDirection: { xs: 'column', sm: 'row' }, gap: 2 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', color: 'text.secondary' }}>
                                        <ClockIcon sx={{ mr: 1 }} />
                                        <Typography variant="body2">Expected response time: 24 hours</Typography>
                                    </Box>
                                    <Button 
                                        type="submit" 
                                        variant="contained" 
                                        color="primary" 
                                        size="large"
                                        disabled={isSubmitting}
                                        startIcon={isSubmitting ? <CircularProgress size={20} /> : null}
                                    >
                                        {isSubmitting ? 'Creating...' : 'Create Ticket'}
                                    </Button>
                                </Box>
                            </Box>
                        )}
                    </Box>
                </StyledCard>
            </Container>
            
            <LiveChat
                isOpen={isChatOpen}
                onClose={() => setIsChatOpen(false)}
                agentName="Support"
                agentInitial="S"
            />

            {/* Snackbar for notifications */}
            <Snackbar
                open={snackbar.open}
                autoHideDuration={6000}
                onClose={() => setSnackbar({ ...snackbar, open: false })}
            >
                <Alert 
                    onClose={() => setSnackbar({ ...snackbar, open: false })} 
                    severity={snackbar.severity}
                    sx={{ width: '100%' }}
                >
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default Support;