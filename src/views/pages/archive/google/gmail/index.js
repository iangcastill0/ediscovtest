import React, { useEffect, useState } from 'react';
import {
    Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Dialog, DialogContent,
    DialogTitle, TextField, Box, LinearProgress, CircularProgress, Pagination, IconButton, Checkbox, Toolbar, Typography,
    Tooltip, Link
} from '@mui/material';
import AttachmentIcon from '@mui/icons-material/Attachment';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { getGmailArchive, addDownloadGmailLog } from 'utils/apiHelper'; // Import the downloadAttachment function
import { useParams, useNavigate } from 'react-router-dom';
import MainCard from 'ui-component/cards/MainCard';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import DownloadIcon from '@mui/icons-material/Download';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { downloadGmailAsEml } from 'utils/utils';
import useDownload from 'hooks/useDownload';
import SimpleSearchDialog from 'ui-component/extended/SimpleSearchDialog';

const GmailTable = () => {
    const [open, setOpen] = useState(false);
    const [selectedEmail, setSelectedEmail] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [rows, setRows] = useState([]);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(false);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const { backupId } = useParams();
    const [exporting, setExporting] = useState(false);
    const [totalMessages, setTotalMessages] = useState(0);
    const [selectedEmails, setSelectedEmails] = useState([]);
    const [downloadProgress, setDownloadProgress] = useState({}); // State for download progress
    const { startDownload } = useDownload()
    const [dialogOpen, setDialogOpen] = useState(false);
    const [logOpen, setLogOpen] = useState(false);
    const [downloadLogs, setDownloadLogs] = useState([]);
    const navigate = useNavigate();

    const fetchMessages = async (backupId, page, limit) => {
        setLoading(true);
        const response = await getGmailArchive(backupId, { page, limit });
        if (response.ok) {
            setRows(response.data);
            setTotalMessages(response.total);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchMessages(backupId, 1, rowsPerPage);
    }, [backupId, rowsPerPage]);

    const handleChangePage = (event, newPage) => {
        setPage(newPage);
        fetchMessages(backupId, newPage, rowsPerPage);
    };

    const handleChangeRowsPerPage = (event) => {
        const newRowsPerPage = parseInt(event.target.value, 10);
        setRowsPerPage(newRowsPerPage);
        setPage(1);
        fetchMessages(backupId, 1, newRowsPerPage);
    };

    const handleRowClick = (email) => {
        setSelectedEmail(email);
        setOpen(true);
    };

    const handleDownload = async (email) => {
        await downloadGmailAsEml(email);
        await addDownloadGmailLog(email.id);
        fetchMessages(backupId, 1, rowsPerPage);
    };

    const handleClose = () => {
        setOpen(false);
    };

    const handleSearch = () => {
        setLoading(true);
        if (searchQuery) {
            const searchLower = searchQuery.toLowerCase();
            const filtered = rows.filter(email => email.subject.toLowerCase().includes(searchLower) ||
                email.from?.toLowerCase().includes(searchLower) ||
                email.to?.toLowerCase().includes(searchLower) ||
                email.msg?.toLowerCase().includes(searchLower));
            setRows(filtered);
        } else {
            fetchMessages(backupId, page, rowsPerPage); // Fetch messages again if search query is cleared
        }
        setLoading(false);
    };

    const handleExport = async () => {
        const messageIds = selectedEmails.map(email => email.id);
        // await getArchiveOutlookBulkDownload(backupId, messagesIds, `${new Date().toISOString()}.zip`)
        startDownload({
            type: 'GmailArchive', 
            isArchive: true, 
            name: `${keywords.replace(/[^a-z0-9]/gi, '_')}_${jobName.replace(/[^a-z0-9]/gi, '_')}_${new Date().toISOString()}.zip`, 
            id: Date.now(), 
            url: `/archive/gmail/${backupId}/bulkDownload`, 
            size: undefined, 
            responseType: 'blob',
            axiosType: 'POST',
            postData: {messageIds}
        })
    };

    const handleEntireDownload = async () => {
        startDownload({
            type: 'GmailArchive', 
            isArchive: true, 
            name: `${keywords.replace(/[^a-z0-9]/gi, '_')}_${jobName.replace(/[^a-z0-9]/gi, '_')}_${new Date().toISOString()}.zip`, 
            id: Date.now(), 
            url: `/archive/gmail/${backupId}/bulkDownload?type=entire`, 
            size: undefined, 
            responseType: 'blob',
            axiosType: 'POST'
        })
    };

    const handleSelectAllClick = (event) => {
        if (event.target.checked) {
            const newSelectedEmails = rows.map((email) => email);
            setSelectedEmails(newSelectedEmails);
            return;
        }
        setSelectedEmails([]);
    };

    const handleSelectClick = (event, email) => {
        const selectedIndex = selectedEmails.indexOf(email);
        let newSelectedEmails = [];

        if (selectedIndex === -1) {
            newSelectedEmails = newSelectedEmails.concat(selectedEmails, email);
        } else if (selectedIndex === 0) {
            newSelectedEmails = newSelectedEmails.concat(selectedEmails.slice(1));
        } else if (selectedIndex === selectedEmails.length - 1) {
            newSelectedEmails = newSelectedEmails.concat(selectedEmails.slice(0, -1));
        } else if (selectedIndex > 0) {
            newSelectedEmails = newSelectedEmails.concat(selectedEmails.slice(0, selectedIndex), selectedEmails.slice(selectedIndex + 1));
        }

        setSelectedEmails(newSelectedEmails);
    };

    const isSelected = (email) => selectedEmails.indexOf(email) !== -1;

    const handleAttachmentDownload = async (attachment) => {
        try {
            // setDownloadProgress((prevState) => ({ ...prevState, [attachment.attachmentId]: 0 }));
            // await downloadArchiveGmailAttachment(backupId, attachment.s3Key, attachment.filename, (progressEvent) => {
            //     const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            //     setDownloadProgress((prevState) => ({ ...prevState, [attachment.attachmentId]: progress }));
            // });
            startDownload({
                type: 'GmailArchive', 
                isArchive: true, 
                name: `${attachment.filename}.zip`, 
                id: Date.now(), 
                url: `/archive/s3/download_v2?s3Key=${attachment.s3Key}&filename=${attachment.filename}`, 
                size: attachment.size, 
                responseType: 'blob'
            })    
            // setDownloadProgress((prevState) => ({ ...prevState, [attachment.attachmentId]: 100 }));
        } catch (error) {
            console.error('Error downloading attachment:', error);
            // setDownloadProgress((prevState) => ({ ...prevState, [attachment.attachmentId]: null }));
        }
    };

    const query = new URLSearchParams(window.location.search);
    const title = query.get('name');

    const totalPages = Math.ceil(totalMessages / rowsPerPage);

    const handleAdvancedSearchSubmit = (data) => {
        console.log('Gmail Advanced Search Data:', data);
        let parameterText = `q=${data.keywords}`;
        if (data.dateRange.start) {
            parameterText += `&start=${data.dateRange.start.toLocaleDateString('en-CA')}`;
        }
        if (data.dateRange.end) {
            parameterText += `&end=${data.dateRange.end.toLocaleDateString('en-CA')}`;
        }
        if (data.emailFilters.from !== '') {
            parameterText += `&from=${data.emailFilters.from}`;
        }
        if (data.emailFilters.to !== '') {
            parameterText += `&to=${data.emailFilters.to}`;
        }
        parameterText += `&archives=${backupId}`;
        parameterText += `&type=gmail`;
        navigate(`/search?${parameterText}`, { replace: true, state: { forceRefresh: true } });
    };

    const handleDownloadLogClick = (logs) => {
        setDownloadLogs(logs);
        setLogOpen(true);
    };

    const handleLogClose = () => {
        setLogOpen(false);
        setDownloadLogs([]);
    };

    return (
        <MainCard title={`${title}`} backButton>
            {(loading || exporting) && <LinearProgress />}
            <LocalizationProvider dateAdapter={AdapterDateFns}>
                <TextField
                    label="Search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{ margin: 8 }}
                />
                <Button
                    variant="contained"
                    onClick={handleSearch}
                    style={{ margin: 8, marginTop: 14 }}
                >
                    Search
                </Button>
                
                <Button
                    variant="contained"
                    onClick={() => setDialogOpen(true)}
                    style={{ margin: 8, marginTop: 14, float: 'right' }}
                >
                    {'Advanced\nSearch'}
                </Button>
                <Button
                    variant="contained"
                    onClick={handleEntireDownload}
                    style={{ margin: 8, marginTop: 14, float: 'right' }}
                >
                    {'Entire Download'}
                </Button>
            </LocalizationProvider>

            <Toolbar
                sx={{
                    p: 0,
                    pl: 2,
                    pr: 1,
                    ...(selectedEmails.length > 0 && {
                        color: (theme) => theme.palette.secondary.main
                    })
                }}
            >
                {selectedEmails.length > 0 ? (
                    <Typography color='inherit' variant='subtitle1'>
                        {selectedEmails.length} selected
                    </Typography>
                ) : (
                    <Typography variant='h6' id='tableTitle'>
                        No selection
                    </Typography>
                )}
                <Box sx={{ flexGrow: 1 }} />
                {selectedEmails.length > 0 && (
                    <Button
                        variant="contained"
                        color="primary"
                        startIcon={exporting ? <CircularProgress size={24} /> : <FileDownloadIcon />}
                        onClick={handleExport}
                        disabled={exporting}
                    >
                        Bulk Download
                    </Button>
                )}
            </Toolbar>

            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell padding="checkbox">
                                <Checkbox
                                    color="primary"
                                    indeterminate={selectedEmails.length > 0 && selectedEmails.length < rows.length}
                                    checked={rows.length > 0 && selectedEmails.length === rows.length}
                                    onChange={handleSelectAllClick}
                                    inputProps={{
                                        'aria-label': 'select all emails',
                                    }}
                                />
                            </TableCell>
                            <TableCell>Subject</TableCell>
                            <TableCell>Preview</TableCell>
                            <TableCell>From</TableCell>
                            <TableCell>To</TableCell>
                            <TableCell>Date</TableCell>
                            <TableCell>Downloads</TableCell>
                            <TableCell>Attachments</TableCell>
                            <TableCell>Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {rows.map((email) => {
                            const isItemSelected = isSelected(email);
                            const labelId = `enhanced-table-checkbox-${email.id}`;

                            return (
                                <TableRow
                                    key={email.id}
                                    hover
                                    role="checkbox"
                                    aria-checked={isItemSelected}
                                    tabIndex={-1}
                                    selected={isItemSelected}
                                >
                                    <TableCell padding="checkbox" onClick={(event) => handleSelectClick(event, email)}>
                                        <Checkbox
                                            color="primary"
                                            checked={isItemSelected}
                                            inputProps={{
                                                'aria-labelledby': labelId,
                                            }}
                                        />
                                    </TableCell>
                                    <TableCell>{email.subject}</TableCell>
                                    <TableCell>
                                        <Tooltip title={email.preview || 'No preview available'} style={{ fontSize: '50px' }} arrow>
                                            <Typography
                                                variant="body2"
                                                noWrap
                                                style={{
                                                    maxWidth: 200, // Adjust this value as needed for truncating the text
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                    whiteSpace: 'nowrap',
                                                }}
                                            >
                                                {email.preview || 'No preview available'}
                                            </Typography>
                                        </Tooltip>
                                    </TableCell>
                                    <TableCell>{email.from}</TableCell>
                                    <TableCell>{email.to}</TableCell>
                                    <TableCell>{email.date}</TableCell>
                                    <TableCell align='center'>
                                        {email.downloadLogs.length > 0 ? (
                                            <span
                                                role="button"
                                                tabIndex="0"
                                                style={{ color: 'blue', textDecoration: 'underline', cursor: 'pointer' }}
                                                onClick={() => handleDownloadLogClick(email.downloadLogs)}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter' || e.key === ' ') {
                                                        handleDownloadLogClick(email.downloadLogs);
                                                    }
                                                }}
                                            >
                                                {email.downloadLogs.length}
                                            </span>
                                        ) : (
                                            email.downloadLogs.length
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        {email.attachments.length ? (
                                            email.attachments.map((attachment) => (
                                                <Link
                                                    key={attachment.attachmentId}
                                                    component="button"
                                                    onClick={() => handleAttachmentDownload(attachment)}
                                                    underline="always"
                                                    color="primary"
                                                    style={{ marginRight: 8 }}
                                                >
                                                    {attachment.filename}
                                                </Link>
                                            ))
                                        ) : ''}
                                    </TableCell>
                                    <TableCell align='left'>
                                        <Box display="flex" justifyContent="center" alignItems="center">
                                            <IconButton onClick={() => handleRowClick(email)}>
                                                <VisibilityIcon />
                                            </IconButton>
                                            <IconButton onClick={() => handleDownload(email)}>
                                                <DownloadIcon />
                                            </IconButton>
                                        </Box>
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </TableContainer>

            <Box display="flex" justifyContent="center" alignItems="center" my={2}>
                <Pagination
                    count={totalPages}
                    page={page}
                    onChange={handleChangePage}
                    color="primary"
                />
                {loading && <CircularProgress size={24} style={{ marginLeft: 16 }} />}
            </Box>

            <Dialog open={open} onClose={handleClose} maxWidth="lg">
                <DialogTitle>Email Details</DialogTitle>
                <DialogContent>
                    <div>
                        <strong>From:</strong> {selectedEmail?.from}
                    </div>
                    <div>
                        <strong>To:</strong> {selectedEmail?.to}
                    </div>
                    <div>
                        <strong>Subject:</strong> {selectedEmail?.subject}
                    </div>
                    <div>
                        <strong>Date:</strong> {selectedEmail?.date}
                    </div>
                    <div>
                        <strong>Body:</strong>
                        <div dangerouslySetInnerHTML={{ __html: selectedEmail?.msg }} />
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog open={logOpen} onClose={handleLogClose} maxWidth="md">
                <DialogTitle>Download Logs</DialogTitle>
                <DialogContent>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>Email</TableCell>
                                <TableCell>Name</TableCell>
                                <TableCell>Downloaded At</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {downloadLogs.map((log, index) => (
                                <TableRow key={index}>
                                    <TableCell>{log.userEmail}</TableCell>
                                    <TableCell>{log.userName}</TableCell>
                                    <TableCell>{log.downloadedAt}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </DialogContent>
            </Dialog>
            <SimpleSearchDialog
                open={dialogOpen}
                onClose={() => setDialogOpen(false)}
                onSubmit={handleAdvancedSearchSubmit}
                isEmail
            />
        </MainCard>
    );
};

export default GmailTable;
