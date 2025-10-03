import PropTypes from 'prop-types';
import * as React from 'react';
import { useTheme } from '@mui/material/styles';
import {
    Box,
    CardContent,
    Checkbox,
    Grid,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TablePagination,
    TableRow,
    TableSortLabel,
    LinearProgress,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    Toolbar,
    Typography,
    IconButton,
    Tooltip,
    CircularProgress
} from '@mui/material';
import { visuallyHidden } from '@mui/utils';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import VisibilityIcon from '@mui/icons-material/Visibility';
import axiosServices from "utils/axios";
import MainCard from 'ui-component/cards/MainCard';
import { getHtmlPart, decodeGmailData } from 'utils/utils';
import useDownload from 'hooks/useDownload';
import SearchBox from 'ui-component/extended/SearchBox';
import SimpleSearchDialog from 'ui-component/extended/SimpleSearchDialog';
import axios from 'utils/axios';
import Flag from 'ui-component/extended/Flag';
import { getStoredCollectionMap } from 'utils/apiHelper';

function descendingComparator(a, b, orderBy) {
    if (b[orderBy] < a[orderBy]) {
        return -1;
    }
    if (b[orderBy] > a[orderBy]) {
        return 1;
    }
    return 0;
}

const getComparator = (order, orderBy) =>
    order === 'desc' ? (a, b) => descendingComparator(a, b, orderBy) : (a, b) => -descendingComparator(a, b, orderBy);

function stableSort(array, comparator) {
    const stabilizedThis = array.map((el, index) => [el, index]);
    stabilizedThis.sort((a, b) => {
        const order = comparator(a[0], b[0]);
        if (order !== 0) return order;
        return a[1] - b[1];
    });
    return stabilizedThis.map((el) => el[0]);
}

const headCells = [
    { id: 'from', numeric: false, label: 'From', align: 'left' },
    { id: 'to', numeric: false, label: 'To', align: 'left' },
    { id: 'subject', numeric: false, label: 'Subject', align: 'left' },
    { id: 'snippet', numeric: false, label: 'Snippet', align: 'left' },
    { id: 'sentDateTime', numeric: false, label: 'Date', align: 'center' },
    { id: 'actions', numeric: false, label: 'Actions', align: 'center' }
];

function EnhancedTableHead({ 
    order, 
    orderBy, 
    onRequestSort, 
    onSelectAllClick, 
    numSelected, 
    rowCount,
    selected,
    handleBulkDownload,
    loadingBulkDownload
}) {
    const createSortHandler = (property) => (event) => {
        onRequestSort(event, property);
    };

    return (
        <TableHead>
            <TableRow>
                <TableCell padding='none' />
                <TableCell padding='none'>
                    <Checkbox
                        color='primary'
                        indeterminate={numSelected > 0 && numSelected < rowCount}
                        checked={rowCount > 0 && numSelected === rowCount}
                        onChange={onSelectAllClick}
                        inputProps={{
                            'aria-label': 'select all emails'
                        }}
                    />
                </TableCell>
                {numSelected > 0 && (
                    <TableCell padding='none' colSpan={5}>
                        <EnhancedTableToolbar
                            numSelected={selected.length}
                            handleBulkDownload={handleBulkDownload}
                            loadingBulkDownload={loadingBulkDownload}
                        />
                    </TableCell>
                )}
                {numSelected <= 0 && headCells.map((headCell) => (
                    <TableCell
                        key={headCell.id}
                        align={headCell.align}
                        padding={headCell.disablePadding ? 'none' : 'normal'}
                        sortDirection={orderBy === headCell.id ? order : false}
                    >
                        <TableSortLabel
                            active={orderBy === headCell.id}
                            direction={orderBy === headCell.id ? order : 'asc'}
                            onClick={createSortHandler(headCell.id)}
                        >
                            {headCell.label}
                            {orderBy === headCell.id ? (
                                <Box component="span" sx={visuallyHidden}>
                                    {order === 'desc' ? 'sorted descending' : 'sorted ascending'}
                                </Box>
                            ) : null}
                        </TableSortLabel>
                    </TableCell>
                ))}
            </TableRow>
        </TableHead>
    );
}

EnhancedTableHead.propTypes = {
    onRequestSort: PropTypes.func.isRequired,
    order: PropTypes.oneOf(['asc', 'desc']).isRequired,
    orderBy: PropTypes.string.isRequired,
    onSelectAllClick: PropTypes.func.isRequired,
    numSelected: PropTypes.number.isRequired,
    rowCount: PropTypes.number.isRequired,
    selected: PropTypes.array,
    handleBulkDownload: PropTypes.func.isRequired,
    loadingBulkDownload: PropTypes.bool.isRequired
};

const EnhancedTableToolbar = ({ numSelected, handleBulkDownload, loadingBulkDownload }) => (
    <Toolbar
        sx={{
            p: 0,
            pl: 1,
            pr: 1,
            ...(numSelected > 0 && {
                color: (theme) => theme.palette.secondary.main
            })
        }}
    >
        {numSelected > 0 ? (
            <Typography color='inherit' variant='h4'>
                {numSelected} Selected
            </Typography>
        ) : (
            <Typography variant='h6' id='tableTitle'>
                No selection
            </Typography>
        )}
        <Box sx={{ flexGrow: 1 }} />
        {numSelected > 0 && (
            <div>
                <Button 
                    variant='contained' 
                    color='secondary' 
                    startIcon={loadingBulkDownload ? <CircularProgress size={24} /> : <FileDownloadIcon />} 
                    onClick={handleBulkDownload} 
                    disabled={loadingBulkDownload}
                >
                    Bulk Download
                </Button>
            </div>
        )}
    </Toolbar>
);

EnhancedTableToolbar.propTypes = {
    numSelected: PropTypes.number.isRequired,
    handleBulkDownload: PropTypes.func.isRequired,
    loadingBulkDownload: PropTypes.bool.isRequired
};

const MessageDetailDialog = ({ open, onClose, message, workspaceId, userId, isPersonal, downloadEmailAsEML, startDownload }) => {
    const getSafeHTMLContent = (emailData) => {
        if (!emailData) return '';
        const payload = emailData.payload;
        let encodedHtml = '';
        if (payload?.mimeType === 'text/html') {
            encodedHtml = payload.body.data;
        } else {
            encodedHtml = getHtmlPart(payload.parts);
        }
        const decodedHtml = decodeGmailData(encodedHtml);
        return decodedHtml;
    };

    const extractHeader = (headers, name) => {
        if (!headers) return '';
        const header = headers.find(h => h.name.toLowerCase() === name.toLowerCase());
        return header ? header.value : 'Unknown';
    };

    const formatDate = (dateString) => {
        return dateString ? new Date(dateString).toLocaleString() : 'Unknown';
    };

    const downloadAttachment = async (attachment) => {
        if (!attachment.attachmentId) {
            console.error('Attachment ID is missing.');
            return;
        }

        try {
            startDownload({
                type: 'GmailAttachment', 
                isArchive: false, 
                name: attachment.filename, 
                id: Date.now(), 
                url: `/google/workspace/${workspaceId}/users/${userId}/attachments/${message.id}/${attachment.attachmentId}?isPersonal=${isPersonal}`, 
                size: attachment.size, 
                responseType: 'blob'
            });
        } catch (error) {
            console.error('Failed to download attachment:', error);
        }
    };

    const renderAttachments = (attachments) => {
        if (!attachments || attachments.length === 0) return null;

        return (
            <div style={{ marginTop: '20px' }}>
                <h4>Attachments</h4>
                <ul>
                    {attachments.map((attachment, index) => (
                        <li key={index}>
                            <Button
                                onClick={() => downloadAttachment(attachment)}
                                startIcon={<FileDownloadIcon />}
                            >
                                {attachment.filename}
                            </Button>
                        </li>
                    ))}
                </ul>
            </div>
        );
    };

    const getAttachments = (parts) => {
        if (!parts) return [];
        const attachments = [];

        parts.forEach((part) => {
            if (part.body?.attachmentId) {
                attachments.push({
                    attachmentId: part.body.attachmentId,
                    filename: part.filename,
                    mimeType: part.mimeType,
                    size: part.body.size
                });
            } else if (part.parts) {
                attachments.push(...getAttachments(part.parts));
            }
        });

        return attachments;
    };

    const attachments = getAttachments(message?.payload?.parts);

    const downloadAsEML = () => {
        downloadEmailAsEML(message, userId, workspaceId, isPersonal);
    };

    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
            <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Message Detail</span>
                <div>
                    <Button variant="contained" onClick={downloadAsEML} style={{ marginRight: '10px' }}>
                        Download EML
                    </Button>
                    <Button variant="outlined" onClick={onClose}>
                        Close
                    </Button>
                </div>
            </DialogTitle>
            <DialogContent>
                <div style={{ marginBottom: '20px' }}>
                    <p><strong>Subject:</strong> {extractHeader(message?.payload?.headers, 'Subject')}</p>
                    <p><strong>From:</strong> {extractHeader(message?.payload?.headers, 'From')}</p>
                    <p><strong>To:</strong> {extractHeader(message?.payload?.headers, 'To')}</p>
                    <p><strong>Date:</strong> {formatDate(extractHeader(message?.payload?.headers, 'Date'))}</p>
                </div>
                <div dangerouslySetInnerHTML={{ __html: getSafeHTMLContent(message) }} />
                {renderAttachments(attachments)}
            </DialogContent>
        </Dialog>
    );
};

MessageDetailDialog.propTypes = {
    open: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    message: PropTypes.object.isRequired,
    workspaceId: PropTypes.string.isRequired,
    userId: PropTypes.string.isRequired,
    isPersonal: PropTypes.string.isRequired,
    downloadEmailAsEML: PropTypes.func.isRequired,
    startDownload: PropTypes.func.isRequired,
};

const Messages = ({ workspaceId, userId, isPersonal, labelId }) => {
    const [order, setOrder] = React.useState('asc');
    const [orderBy, setOrderBy] = React.useState('name');
    const [page, setPage] = React.useState(0);
    const [rowsPerPage, setRowsPerPage] = React.useState(10);
    const [rows, setRows] = React.useState([]);
    const [selected, setSelected] = React.useState([]);
    const [selectedMessage, setSelectedMessage] = React.useState(null);
    const [isDialogOpen, setIsDialogOpen] = React.useState(false);
    const [loading, setLoading] = React.useState(false);
    const [emails, setEmails] = React.useState([]);
    const [tokens, setTokens] = React.useState(['']);
    const [currentIndex, setCurrentIndex] = React.useState(0);
    const [isLastPage, setIsLastPage] = React.useState(false);
    const [currentSearch, setCurrentSearch] = React.useState({});
    const [dialogOpen, setDialogOpen] = React.useState(false);
    const [flagCollections, setFlagCollections] = React.useState([]);
    const [storedCollectionMap, setStoredCollectionMap] = React.useState({});
    const [loadingBulkDownload, setLoadingBulkDownload] = React.useState(false);

    const { startDownload } = useDownload();

    const fetchEmails = async (firstTime = false) => {
        setLoading(true);
        try {
            const queryParams = new URLSearchParams({
                labelId,
                pageToken: tokens[currentIndex],
                isPersonal,
                ...(currentSearch.keywords && { q: currentSearch.keywords }),
                ...(currentSearch.dateRange?.start && { after: Math.floor(new Date(currentSearch.dateRange.start).getTime() / 1000) }),
                ...(currentSearch.dateRange?.end && { before: Math.floor(new Date(currentSearch.dateRange.end).getTime() / 1000) }),
                ...(currentSearch.emailFilters?.from && { from: currentSearch.emailFilters.from }),
                ...(currentSearch.emailFilters?.to && { to: currentSearch.emailFilters.to })
            });

            const rep = await axios.get('/flagged-collections/collectionList');
            const storedCollectionsMap = await getStoredCollectionMap('gmail');
            const flaggedCollections = rep.data?.data || [];
            setFlagCollections(flaggedCollections);
            setStoredCollectionMap(storedCollectionsMap);

            const response = await axiosServices.get(`/google/workspace/${workspaceId}/users/${userId}/emails?${queryParams}`);
            const data = response.data;
            
            if (firstTime) {
                setEmails(data.messages || []);
                setRows(data.messages || []);
            } else {
                setEmails(prev => [...prev, ...(data.messages || [])]);
                setRows(prev => [...prev, ...(data.messages || [])]);
            }
            
            setIsLastPage(!data.nextPageToken);
            if (data.nextPageToken && !tokens.includes(data.nextPageToken)) {
                setTokens(prev => [...prev, data.nextPageToken]);
            }
        } catch (error) {
            console.error('Failed to load emails:', error);
        } finally {
            setLoading(false);
        }
    };

    React.useEffect(() => {
        setEmails([]);
        setPage(0);
        setCurrentIndex(0);
        setRows([]);
        setSelected([]);
        setTokens(['']);
        setIsLastPage(false);
        fetchEmails(true);
    }, [labelId, currentSearch]);

    React.useEffect(() => {
        if (currentIndex > 0) {
            fetchEmails();
        }
    }, [currentIndex]);

    const handleRequestSort = (event, property) => {
        const isAsc = orderBy === property && order === 'asc';
        setOrder(isAsc ? 'desc' : 'asc');
        setOrderBy(property);
    };

    const handleSelectAllClick = (event) => {
        if (event.target.checked) {
            const newSelecteds = rows.map((n) => n.id);
            setSelected(newSelecteds);
            return;
        }
        setSelected([]);
    };

    const handleClick = (event, id) => {
        const selectedIndex = selected.indexOf(id);
        let newSelected = [];

        if (selectedIndex === -1) {
            newSelected = newSelected.concat(selected, id);
        } else if (selectedIndex === 0) {
            newSelected = newSelected.concat(selected.slice(1));
        } else if (selectedIndex === selected.length - 1) {
            newSelected = newSelected.concat(selected.slice(0, -1));
        } else if (selectedIndex > 0) {
            newSelected = newSelected.concat(selected.slice(0, selectedIndex), selected.slice(selectedIndex + 1));
        }

        setSelected(newSelected);
    };

    const isSelected = (id) => selected.indexOf(id) !== -1;

    const handleDialogOpen = async (message) => {
        setLoading(true);
        try {
            const response = await axiosServices.get(`/google/workspace/${workspaceId}/users/${userId}/${message.id}?isPersonal=${isPersonal}`);
            setSelectedMessage(response.data);
            setIsDialogOpen(true);
        } catch (error) {
            console.error('Failed to fetch message details:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDialogClose = () => {
        setSelectedMessage(null);
        setIsDialogOpen(false);
    };

    const handleChangePage = (event, newPage) => {
        if (newPage > page && !isLastPage) {
            if (currentIndex + 1 >= Math.floor(emails.length / rowsPerPage)) {
                setIsLastPage(true);
            } 
            setCurrentIndex(currentIndex + 1);
        } else if (newPage < page && currentIndex > 0) {
            setCurrentIndex(currentIndex - 1);
            setIsLastPage(false);
        }
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };
    
    const truncateSnippet = (snippet, length = 50) => {
        return snippet?.length > length ? `${snippet.substring(0, length)}...` : snippet;
    };

    const extractFrom = (message) => {
        const fromHeader = message?.payload?.headers?.find(header => header.name === 'From');
        return fromHeader ? fromHeader.value : 'Unknown';
    };

    const extractTo = (message) => {
        const toHeader = message?.payload?.headers?.find(header => header.name === 'To');
        return toHeader ? toHeader.value : 'Unknown';
    };

    const extractSubject = (message) => {
        const subjectHeader = message?.payload?.headers?.find(header => header.name === 'Subject');
        return subjectHeader ? subjectHeader.value : 'No Subject';
    };

    const extractSentDate = (message) => {
        const dateHeader = message?.payload?.headers?.find(header => header.name === 'Date');
        return dateHeader ? new Date(dateHeader.value).toLocaleString() : 'Unknown';
    };

    const downloadEmailAsEML = (message, userId, workspaceId, isPersonal, subject) => {
        if (!message?.id) {
            console.error('Invalid message format');
            return;
        }
        startDownload({
            type: 'Gmail_v2', 
            isArchive: false, 
            name: `${subject.replace(/[^a-z0-9]/gi, '_') || 'no_subject'}.zip`, 
            id: Date.now(), 
            url: `/google/workspace/${workspaceId}/users/${userId}/${message.id}?isPersonal=${isPersonal}`, 
            // size: message.sizeEstimate, 
            responseType: 'blob'
        });
    };

    const handleBulkDownload = async () => {
        setLoadingBulkDownload(true);
        try {
            startDownload({
                type: 'GmailDownload', 
                isArchive: true, 
                name: `gmail_bulk_${new Date().toISOString().slice(0, 10)}.zip`, 
                id: Date.now(), 
                url: `/google/workspace/${workspaceId}/users/${userId}/bulk-download`, 
                size: undefined, 
                responseType: 'blob',
                axiosType: 'POST',
                postData: { 
                    messageIds: selected,
                    isPersonal 
                }
            });
        } catch (error) {
            console.error('Failed to bulk download emails:', error);
        } finally {
            setLoadingBulkDownload(false);
        }
    };

    const handleAdvancedSearchSubmit = (searchParams) => {
        setCurrentSearch(searchParams);
    };

    const handleClearSearch = () => {
        setCurrentSearch({});
    };

    const handleKeywordsChange = (keywords) => {
        setCurrentSearch(prev => ({ ...prev, keywords }));
    };

    return (
        <MainCard content={false}>
            {loading && <LinearProgress />}
            
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <SearchBox 
                    handleSearch={(keywords) => setCurrentSearch(prev => ({ ...prev, keywords }))}
                    handleOpenDialog={setDialogOpen}
                    currentSearch={currentSearch}
                    onClearSearch={handleClearSearch}
                    onKeywordsChange={handleKeywordsChange}
                />
            </Box>
            
            <SimpleSearchDialog 
                open={dialogOpen} 
                onClose={() => setDialogOpen(false)} 
                onSubmit={handleAdvancedSearchSubmit}
                isEmail={true}
            />
            
            <TableContainer>
                <Table>
                    <EnhancedTableHead
                        order={order}
                        orderBy={orderBy}
                        onRequestSort={handleRequestSort}
                        onSelectAllClick={handleSelectAllClick}
                        numSelected={selected.length}
                        rowCount={rows.length}
                        selected={selected}
                        handleBulkDownload={handleBulkDownload}
                        loadingBulkDownload={loadingBulkDownload}
                    />
                    <TableBody>
                        {stableSort(rows, getComparator(order, orderBy))
                            .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                            .map((row) => {
                                const isItemSelected = isSelected(row.id);
                                const labelId = `enhanced-table-checkbox-${row.id}`;
                                const from = extractFrom(row);
                                const to = extractTo(row);
                                const subject = extractSubject(row);
                                const date = extractSentDate(row);
                                row.workspaceId = workspaceId;
                                row.userId = userId;
                                row.isPersonal = isPersonal;
                                
                                return (
                                    <TableRow 
                                        hover 
                                        tabIndex={-1} 
                                        key={row.id}
                                        selected={isItemSelected}
                                    >
                                        <TableCell padding='none'>
                                            <Flag
                                                rowId={row.id}
                                                type="gmail"
                                                collections={flagCollections}
                                                rowData={row}
                                                initialFlag={flagCollections.find((e) => e._id === storedCollectionMap[row.id])}
                                            />
                                        </TableCell>
                                        <TableCell padding="checkbox">
                                            <Checkbox
                                                color="primary"
                                                checked={isItemSelected}
                                                onClick={(event) => handleClick(event, row.id)}
                                                inputProps={{
                                                    'aria-labelledby': labelId,
                                                }}
                                            />
                                        </TableCell>
                                        <TableCell component="th" id={labelId} scope="row" padding="none">
                                            {truncateSnippet(from, 20)}
                                        </TableCell>
                                        <TableCell component="th" id={labelId} scope="row" padding="none">
                                            {truncateSnippet(to, 20)}
                                        </TableCell>
                                        <TableCell component="th" id={labelId} scope="row" padding="none">
                                            {truncateSnippet(subject, 30)}
                                        </TableCell>
                                        <TableCell>
                                            {truncateSnippet(row.snippet)}
                                        </TableCell>
                                        <TableCell>
                                            {date}
                                        </TableCell>
                                        <TableCell align="center">
                                            <Box display="flex" justifyContent="center" alignItems="center">
                                                <Tooltip title="View">
                                                    <IconButton 
                                                        onClick={() => handleDialogOpen(row)}
                                                    >
                                                        <VisibilityIcon />
                                                    </IconButton>
                                                </Tooltip>
                                                <Tooltip title="Download">
                                                    <IconButton 
                                                        onClick={() => downloadEmailAsEML(row, userId, workspaceId, isPersonal, subject)}
                                                    >
                                                        <FileDownloadIcon />
                                                    </IconButton>
                                                </Tooltip>
                                            </Box>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                    </TableBody>
                </Table>
            </TableContainer>
            
            <TablePagination
                rowsPerPageOptions={[5, 10, 25]}
                component="div"
                count={rows.length}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
                nextIconButtonProps={{ disabled: isLastPage }}
            />
            
            <MessageDetailDialog
                open={isDialogOpen}
                onClose={handleDialogClose}
                message={selectedMessage}
                workspaceId={workspaceId}
                userId={userId}
                isPersonal={isPersonal}
                downloadEmailAsEML={downloadEmailAsEML}
                startDownload={startDownload}
            />
        </MainCard>
    );
};

Messages.propTypes = {
    userId: PropTypes.string.isRequired,
    labelId: PropTypes.string.isRequired,
    isPersonal: PropTypes.string.isRequired,
    workspaceId: PropTypes.string.isRequired,
};

export default Messages;