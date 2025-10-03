import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
    Box, Container, Typography, Grid, Card, CardContent, Paper, Table, TableBody,
    TableCell, TableContainer, TableHead, TableRow, Chip, Tabs, Tab, TextField,
    InputAdornment, IconButton, Modal, Button, Select, MenuItem, FormControl,
    InputLabel, useTheme, Tooltip, CircularProgress, Alert, Snackbar
} from '@mui/material';
import {
    Search as SearchIcon, Visibility as ViewIcon, Close as CloseIcon, Inbox as InboxIcon,
    HourglassEmpty as PendingIcon, CheckCircleOutline as ResolvedIcon, Send as SendIcon,
    AccessTime as AccessTimeIcon
} from '@mui/icons-material';
import { debounce } from 'lodash';

import { useSupportSettings } from '../../../../contexts/SupportSettingsContext';
import axios from 'utils/axios';

// --- Helper Components & Functions ---

const getPriorityChipColor = (priority) => {
    switch (priority) {
        case 'high': return 'error';
        case 'medium': return 'warning';
        case 'low': return 'info';
        default: return 'default';
    }
};

const getStatusChipColor = (status) => {
    switch (status) {
        case 'open': return 'success';
        case 'pending': return 'warning';
        case 'resolved': return 'default';
        default: return 'default';
    }
};

const StatCard = ({ title, value, icon, color }) => {
    const theme = useTheme();
    return (
        <Card elevation={2}>
            <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box>
                        <Typography color="text.secondary" gutterBottom variant="body2">{title}</Typography>
                        <Typography variant="h4" component="div" sx={{ fontWeight: 'bold' }}>{value}</Typography>
                    </Box>
                    <Box sx={{
                        bgcolor: `${color}.light`, color: `${color}.dark`, borderRadius: '50%',
                        p: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                        {icon}
                    </Box>
                </Box>
            </CardContent>
        </Card>
    );
};

const ChatSettings = () => {
    const { chatHours, setChatHours, saveSettings } = useSupportSettings();
    const [isSaved, setIsSaved] = useState(false);
    const [error, setError] = useState('');

    const handleSettingChange = (field, value) => {
        setChatHours(prev => ({ ...prev, [field]: Number(value) }));
    };

    const handleSave = async () => {
        setError('');
        const success = await saveSettings();
        if (success) {
            setIsSaved(true);
            setTimeout(() => setIsSaved(false), 3000);
        } else {
            setError('Failed to save settings. Please try again.');
        }
    };

    const hoursOptions = [...Array(24).keys()];

    return (
        <Card component={Paper} elevation={3} sx={{ mb: 4 }}>
            <Typography variant="h5" sx={{ p: 2, fontWeight: 'bold' }}>
                <AccessTimeIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
                Live Chat Settings
            </Typography>
            <CardContent>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Set the operating hours for live chat (in EST, 24-hour format).
                </Typography>
                <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} sm={5}>
                        <FormControl fullWidth>
                            <InputLabel>Start Time</InputLabel>
                            <Select value={chatHours.start} label="Start Time" onChange={(e) => handleSettingChange('start', e.target.value)}>
                                {hoursOptions.map(hour => <MenuItem key={hour} value={hour}>{`${hour}:00 EST`}</MenuItem>)}
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid item xs={12} sm={5}>
                        <FormControl fullWidth>
                            <InputLabel>End Time</InputLabel>
                            <Select value={chatHours.end} label="End Time" onChange={(e) => handleSettingChange('end', e.target.value)}>
                                {hoursOptions.map(hour => <MenuItem key={hour} value={hour}>{`${hour}:00 EST`}</MenuItem>)}
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid item xs={12} sm={2}>
                        <Button fullWidth variant="contained" onClick={handleSave} sx={{ height: '56px' }}>
                            {isSaved ? 'Saved!' : 'Save'}
                        </Button>
                    </Grid>
                </Grid>
                {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
            </CardContent>
        </Card>
    );
};


// --- Main Admin Support Component ---

export const AdminSupport = () => {
    const [tickets, setTickets] = useState([]);
    const [stats, setStats] = useState({ open: 0, pending: 0, resolvedThisWeek: 0 });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [tabValue, setTabValue] = useState(0);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedTicket, setSelectedTicket] = useState(null);
    const [replyMessage, setReplyMessage] = useState('');
    const [currentStatus, setCurrentStatus] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

    // API call to fetch tickets
    const fetchTickets = useCallback(async (status, search) => {
        setLoading(true);
        setError(null);
        try {
            const response = await axios.get('/support/admin/tickets', {
                params: { status, search }
            });
            console.log("ResponseData: ", response.data);
            if (response.data.success) {
                setTickets(response.data.data.tickets);
            } else {
                throw new Error(response.data.message || 'Failed to fetch tickets');
            }
        } catch (err) {
            const errorMessage = err.response?.data?.message || err.message;
            setError(errorMessage);
            setSnackbar({ open: true, message: errorMessage, severity: 'error' });
        } finally {
            setLoading(false);
        }
    }, []);

    // API call to fetch stats
    const fetchStats = async () => {
        try {
            const response = await axios.get('/support/admin/stats');
            if (response.data.success) {
                setStats(response.data.data);
            }
        } catch (err) {
            console.error("Failed to fetch stats:", err);
        }
    };

    // Debounced search handler
    const debouncedFetch = useCallback(debounce((status, search) => fetchTickets(status, search), 500), [fetchTickets]);

    useEffect(() => {
        fetchStats();
    }, []);

    useEffect(() => {
        const statusFilter = ['all', 'open', 'pending', 'resolved'][tabValue];
        debouncedFetch(statusFilter, searchTerm);
    }, [tabValue, searchTerm, debouncedFetch]);


    // --- Handlers ---
    const handleTabChange = (event, newValue) => setTabValue(newValue);
    const handleOpenModal = (ticket) => { setSelectedTicket(ticket); setCurrentStatus(ticket.status); };
    const handleCloseModal = () => { setSelectedTicket(null); setReplyMessage(''); };
    const handleSnackbarClose = () => setSnackbar({ ...snackbar, open: false });

    const handleReplyAndStatusUpdate = async () => {
        if (!replyMessage.trim() && selectedTicket.status === currentStatus) {
            setSnackbar({ open: true, message: 'No changes to submit.', severity: 'info' });
            return;
        }

        setIsSubmitting(true);
        try {
            const response = await axios.post(`/support/admin/tickets/${selectedTicket._id}/reply`, {
                message: replyMessage,
                status: currentStatus,
            });

            if (response.data.success) {
                setSnackbar({ open: true, message: 'Ticket updated successfully!', severity: 'success' });
                handleCloseModal();
                // Refresh data
                fetchStats();
                const statusFilter = ['all', 'open', 'pending', 'resolved'][tabValue];
                fetchTickets(statusFilter, searchTerm);
            }
        } catch (err) {
            const errorMessage = err.response?.data?.message || 'Failed to update ticket';
            setSnackbar({ open: true, message: errorMessage, severity: 'error' });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Box sx={{ bgcolor: 'grey.50', minHeight: '100vh', py: 6 }}>
            <Container maxWidth="xl">
                <Typography variant="h3" component="h1" gutterBottom sx={{ fontWeight: 'bold', mb: 4 }}>
                    Support Center
                </Typography>

                <Grid container spacing={3} sx={{ mb: 4 }}>
                    <Grid item xs={12} sm={6} md={4}><StatCard title="Open Tickets" value={stats.open} icon={<InboxIcon />} color="success" /></Grid>
                    <Grid item xs={12} sm={6} md={4}><StatCard title="Pending Tickets" value={stats.pending} icon={<PendingIcon />} color="warning" /></Grid>
                    <Grid item xs={12} sm={6} md={4}><StatCard title="Resolved This Week" value={stats.resolvedThisWeek} icon={<ResolvedIcon />} color="primary" /></Grid>
                </Grid>

                <ChatSettings />
                {/* <AdminChat /> You can re-enable this once it's integrated */}

                <Card component={Paper} elevation={3}>
                    <Typography variant="h5" sx={{ p: 2, fontWeight: 'bold' }}>Support Tickets</Typography>
                    <Box sx={{ borderTop: 1, borderBottom: 1, borderColor: 'divider', p: 2, display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 2 }}>
                        <Tabs value={tabValue} onChange={handleTabChange}>
                            <Tab label="All Tickets" /> <Tab label="Open" /> <Tab label="Pending" /> <Tab label="Resolved" />
                        </Tabs>
                        <TextField size="small" placeholder="Search by ID, user, or subject..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} InputProps={{ startAdornment: (<InputAdornment position="start"><SearchIcon /></InputAdornment>), }} sx={{ minWidth: 300 }} />
                    </Box>

                    <TableContainer>
                        {loading ? (
                            <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}><CircularProgress /></Box>
                        ) : error ? (
                            <Alert severity="error" sx={{ m: 2 }}>{error}</Alert>
                        ) : (
                            <Table sx={{ minWidth: 650 }}>
                                <TableHead>
                                    <TableRow>
                                        <TableCell sx={{ fontWeight: 'bold' }}>Ticket ID</TableCell>
                                        <TableCell sx={{ fontWeight: 'bold' }}>User</TableCell>
                                        <TableCell sx={{ fontWeight: 'bold' }}>Subject</TableCell>
                                        <TableCell sx={{ fontWeight: 'bold' }}>Priority</TableCell>
                                        <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                                        <TableCell sx={{ fontWeight: 'bold' }}>Submitted</TableCell>
                                        <TableCell align="center" sx={{ fontWeight: 'bold' }}>Actions</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {tickets.length > 0 ? tickets.map((ticket) => (
                                        <TableRow key={ticket._id} hover>
                                            <TableCell><Typography variant="body2" sx={{ fontWeight: 'bold', color: 'primary.main' }}>{ticket.ticketId}</Typography></TableCell>
                                            <TableCell>{ticket.userName || 'N/A'}</TableCell>
                                            <TableCell>{ticket.subject}</TableCell>
                                            <TableCell><Chip label={ticket.priority} color={getPriorityChipColor(ticket.priority)} size="small" sx={{ textTransform: 'capitalize' }} /></TableCell>
                                            <TableCell><Chip label={ticket.status} color={getStatusChipColor(ticket.status)} size="small" sx={{ textTransform: 'capitalize' }} /></TableCell>
                                            <TableCell>{new Date(ticket.createdAt).toLocaleDateString()}</TableCell>
                                            <TableCell align="center">
                                                <Tooltip title="View Details"><IconButton onClick={() => handleOpenModal(ticket)} size="small"><ViewIcon /></IconButton></Tooltip>
                                            </TableCell>
                                        </TableRow>
                                    )) : (
                                        <TableRow>
                                            <TableCell colSpan={7} align="center">No tickets found.</TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        )}
                    </TableContainer>
                </Card>
            </Container>

            {/* --- Ticket Details Modal --- */}
            <Modal open={!!selectedTicket} onClose={handleCloseModal}>
                <Box sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '90%', maxWidth: 700, bgcolor: 'background.paper', borderRadius: 2, boxShadow: 24, p: 4, display: 'flex', flexDirection: 'column' }}>
                    <IconButton aria-label="close" onClick={handleCloseModal} sx={{ position: 'absolute', right: 8, top: 8 }}><CloseIcon /></IconButton>
                    {selectedTicket && (
                        <>
                            <Typography variant="h5" component="h2" gutterBottom sx={{ fontWeight: 'bold' }}>{selectedTicket.subject}</Typography>
                            <Box sx={{ mb: 2 }}>
                                <Typography variant="subtitle1"><strong>From:</strong> {selectedTicket.userName} ({selectedTicket.userEmail})</Typography>
                                <Typography variant="subtitle1"><strong>Submitted:</strong> {new Date(selectedTicket.createdAt).toLocaleString()}</Typography>
                            </Box>

                            <Box sx={{ flexGrow: 1, maxHeight: 250, overflowY: 'auto', p: 1, my: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                                {selectedTicket.history.map((entry, index) => (
                                    <Paper key={index} variant="outlined" sx={{ p: 1.5, mb: 1, bgcolor: entry.from === 'admin' ? 'primary.light' : 'grey.100' }}>
                                        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>{entry.from === 'admin' ? 'Support Team' : selectedTicket.userName}</Typography>
                                        <Typography variant="caption" color="text.secondary">{new Date(entry.timestamp).toLocaleString()}</Typography>
                                        <Typography variant="body1" sx={{ mt: 1, whiteSpace: 'pre-wrap' }}>{entry.message}</Typography>
                                    </Paper>
                                ))}
                            </Box>

                            <TextField fullWidth multiline rows={4} label="Your Reply..." variant="outlined" value={replyMessage} onChange={(e) => setReplyMessage(e.target.value)} sx={{ mb: 2 }} />
                            <Grid container spacing={2}>
                                <Grid item xs={12} md={6}>
                                    <FormControl fullWidth>
                                        <InputLabel>Update Status</InputLabel>
                                        <Select value={currentStatus} label="Update Status" onChange={(e) => setCurrentStatus(e.target.value)}>
                                            <MenuItem value="open">Open</MenuItem>
                                            <MenuItem value="pending">Pending</MenuItem>
                                            <MenuItem value="resolved">Resolved</MenuItem>
                                        </Select>
                                    </FormControl>
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    <Button fullWidth variant="contained" onClick={handleReplyAndStatusUpdate} disabled={isSubmitting} startIcon={isSubmitting && <CircularProgress size={20} />} sx={{ height: '56px' }}>
                                        {isSubmitting ? 'Submitting...' : 'Submit Update'}
                                    </Button>
                                </Grid>
                            </Grid>
                        </>
                    )}
                </Box>
            </Modal>

            <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={handleSnackbarClose}>
                <Alert onClose={handleSnackbarClose} severity={snackbar.severity} sx={{ width: '100%' }}>
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default AdminSupport;