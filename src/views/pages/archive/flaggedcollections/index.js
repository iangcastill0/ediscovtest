import PropTypes from 'prop-types';
import React, { useState, useEffect } from 'react';
import {
    Box,
    Checkbox,
    Grid,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TableSortLabel,
    Toolbar,
    Tooltip,
    Button,
    Typography,
    LinearProgress,
    Pagination,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Paper,
    CircularProgress,
    FormControl,
    InputLabel,
    Select,
    MenuItem
} from '@mui/material';
import { visuallyHidden } from '@mui/utils';
import MainCard from 'ui-component/cards/MainCard';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { useParams } from 'react-router-dom'
import DownloadIcon from '@mui/icons-material/Download';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import axios from 'utils/axios';
import { formatSizeUnits } from 'utils/apiHelper';
import useDownload from 'hooks/useDownload';
import SearchBox from 'ui-component/extended/SearchBox';
import SimpleSearchDialog from 'ui-component/extended/SimpleSearchDialog';

const headCells = [
    {
        id: 'source',
        numeric: false,
        label: 'Source',
        align: 'left'
    },
    {
        id: 'name',
        numeric: false,
        label: 'Name/Subject',
        align: 'left'
    },
    {
        id: 'from',
        numeric: false,
        label: 'From',
        align: 'left'
    },
    {
        id: 'to',
        numeric: false,
        label: 'To',
        align: 'left'
    },
    {
        id: 'preview',
        numeric: true,
        label: 'Preview',
        align: 'left'
    },
    {
        id: 'date',
        numeric: false,
        label: 'Date',
        align: 'center'
    },
    {
        id: 'size',
        numeric: true,
        label: 'Size',
        align: 'left'
    },
    {
        id: 'attachments',
        numeric: true,
        label: 'Attachments',
        align: 'left'
    },
    {
        id: 'actions',
        numeric: true,
        label: 'Actions',
        align: 'left'
    }
];

function EnhancedTableHead({
    onSelectAllClick,
    order,
    orderBy,
    numSelected,
    rowCount,
    onRequestSort,
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
                <TableCell padding='checkbox' sx={{ pl: 3 }}>
                    <Checkbox
                        color='primary'
                        indeterminate={numSelected > 0 && numSelected < rowCount}
                        checked={rowCount > 0 && numSelected === rowCount}
                        onChange={onSelectAllClick}
                        inputProps={{
                            'aria-label': 'select all items'
                        }}
                    />
                </TableCell>
                {numSelected > 0 && (
                    <TableCell padding='none' colSpan={6}>
                        <EnhancedTableToolbar
                            numSelected={selected.length}
                            handleBulkDownload={handleBulkDownload}
                            loadingBulkDownload={loadingBulkDownload}
                        />
                    </TableCell>
                )}
                {numSelected <= 0 &&
                    headCells.map((headCell) => (
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
                                    <Box component='span' sx={visuallyHidden}>
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
    selected: PropTypes.array,
    numSelected: PropTypes.number.isRequired,
    onRequestSort: PropTypes.func.isRequired,
    onSelectAllClick: PropTypes.func.isRequired,
    order: PropTypes.oneOf(['asc', 'desc']).isRequired,
    orderBy: PropTypes.string.isRequired,
    rowCount: PropTypes.number.isRequired,
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

const ArchiveFlaggedCollections = () => {
    const [page, setPage] = useState(1);
    const [originalRows, setOriginalRows] = useState([]);
    const [rows, setRows] = useState([]);
    const [order, setOrder] = useState('asc');
    const [orderBy, setOrderBy] = useState('date');
    const [loading, setLoading] = useState(false);
    const [selected, setSelected] = useState([]);
    const [detailOpen, setDetailOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);
    const [loadingBulkDownload, setLoadingBulkDownload] = useState(false);
    const [totalCount, setTotalCount] = useState(0);
    const [filter, setFilter] = useState('all');
    const [searchOpen, setSearchOpen] = useState(false);
    const [currentSearch, setCurrentSearch] = useState({});
    const { collectionId, archiveId } = useParams();
    const { startDownload } = useDownload();

    const params = new URLSearchParams(window.location.search);
    const title = params.get('name');

    const normalizeData = (items) => {
        return items.map((item, index) => {
            const baseItem = {
                id: item.id ? item.id : index,
                type: item.type,
                createdAt: new Date(item.createdAt?.$date).toLocaleString(),
            };
            
            switch(item.type) {
                case 'onedrive':
                    return {
                        ...baseItem,
                        data: item.data,
                        source: 'OneDrive',
                        name: item.data.label || item.data.name,
                        size: formatSizeUnits(item.data.size),
                        date: new Date(item.data.lastModifiedDateTime).toLocaleString(),
                        path: item.data.path,
                        s3Key: item.s3Key,
                        downloadUrl: item.data.downloadUrl,
                        preview: item.data.isFolder ? 'Folder' : 'File'
                    };
                case 'slack':
                    return {
                        ...baseItem,
                        source: 'Slack',
                        date: new Date(item.data.ts * 1000).toLocaleString(),
                        from: item.data.user,
                        preview: truncateText(item.data.message, 30),
                        attachments: item.data.files,
                        attachmentsCount: item.data.files?.length || 0,
                        data: item.data
                    };
                case 'outlook':
                    return {
                        ...baseItem,
                        data: item.data,
                        source: 'Outlook',
                        name: item.data.subject,
                        size: 'N/A',
                        date: new Date(item.data.sentDateTime).toLocaleString(),
                        from: item.data.from,
                        to: item.data.toRecipients?.map(r => r.emailAddress.address).join(', '),
                        preview: truncateText(item.data.preview, 30),
                        content: item.data.content,
                        hasAttachments: item.data.hasAttachments,
                        attachments: item.data.attachments || [],
                        attachmentsCount: item.data.attachments?.length || 0
                    };
                case 'gmail':
                    const subjectHeader = item.data.payload.headers.find(h => h.name === 'Subject');
                    const fromHeader = item.data.payload.headers.find(h => h.name === 'From');
                    return {
                        ...baseItem,
                        data: item.data,
                        source: 'Gmail',
                        name: subjectHeader?.value || 'No Subject',
                        size: formatSizeUnits(item.data.sizeEstimate),
                        date: new Date(parseInt(item.data.internalDate)).toLocaleString(),
                        from: fromHeader?.value || 'Unknown',
                        preview: truncateText(item.data.snippet, 30),
                        content: item.data.html || '',
                        hasAttachments: item.data.attachments?.length > 0,
                        attachments: item.data.attachments || [],
                        attachmentsCount: item.data.attachments?.length || 0
                    };
                case 'googledrive':
                    return {
                        ...baseItem,
                        source: 'Google Drive',
                        data: item.data,
                        name: item.data.label,
                        size: item.data.formattedSize || formatSizeUnits(item.data.size),
                        date: new Date(item.data.modifiedTime).toLocaleString(),
                        path: item.data.id,
                        downloadUrl: null,
                        preview: item.data.type.includes('google-apps') ? 'Google Doc' : 'File',
                        thumbnail: item.data.thumbnailLink,
                        s3Key: item.s3Key,
                        attachments: 'N/A'
                    };
                case 'dropbox':
                    return {
                        ...baseItem,
                        source: 'Dropbox',
                        name: item.data.label,
                        size: item.data.formattedSize || formatSizeUnits(item.data.size),
                        date: new Date(item.data.modifiedTime).toLocaleString(),
                        path: item.data.path,
                        downloadUrl: null,
                        preview: item.data.type === 'file' ? 'File' : 'Folder',
                        thumbnail: item.data.thumbnailLink,
                        attachments: 'N/A',
                        s3Key: item.s3Key,
                        data: item.data
                    };
                default:
                    return baseItem;
            }
        });
    };

    const fetchAllData = async () => {
        setLoading(true);
        
        try {
            const rep = await axios.get(`/archive/flagged-collections/${archiveId}`);
            const result = normalizeData(rep.data?.data);
            setOriginalRows(result);
            setRows(result);
            setTotalCount(result.length);
        } catch (error) {
            console.error('Error fetching data:', error);
        }
        
        setLoading(false);
    };

    useEffect(() => {
        fetchAllData();
    }, [page, collectionId]);

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
            newSelected = newSelected.concat(
                selected.slice(0, selectedIndex),
                selected.slice(selectedIndex + 1)
            );
        }

        setSelected(newSelected);
    };

    const handleChangePage = (event, newPage) => {
        setPage(newPage);
    };

    const handleDownload = (item) => {
        let filename = ''
        let url = ''
        let size = undefined
        switch(item.type) {
            case 'outlook':
                filename = `${truncateText(item.data.subject || item.data.id, 30).replace(/[^a-z0-9]/gi, '_')}.zip`
                url = `/archive/flagged-collections/${archiveId}/download/${item.type === 'slack' ? item.data.ts : item.data.id}`
                break
            case 'gmail':
                filename = `${truncateText(item.data.id, 30).replace(/[^a-z0-9]/gi, '_')}.zip`
                url = `/archive/flagged-collections/${archiveId}/download/${item.type === 'slack' ? item.data.ts : item.data.id}`
                break
            case 'slack':
                filename = `${truncateText(item.data.message, 30).replace(/[^a-z0-9]/gi, '_')}.zip`
                url = `/archive/flagged-collections/${archiveId}/download/${item.type === 'slack' ? item.data.ts : item.data.id}`
                break
            case 'onedrive':
                filename = `${item.data.name}.zip`
                url = `/archive/s3/download_v2?s3Key=${item.s3Key}&filename=${item.data.name}`
                size = parseInt(item.data.size)
                break    
            case 'googledrive':
                filename = `${item.data.label}.zip`
                url = `/archive/s3/download_v2?s3Key=${item.s3Key}&filename=${item.data.label}`
                size = parseInt(item.data.size)
                break    
            case 'dropbox':
                filename = `${item.data.label}.zip`
                url = `/archive/s3/download_v2?s3Key=${item.s3Key}&filename=${item.data.label}`
                size = parseInt(item.data.size)
                break    
        }
        let downloadConfig = {
            type: 'FlaggedCollections',
            isArchive: true, 
            name: filename,
            id: Date.now(), 
            url,
            size, 
            responseType: 'blob',
        };
        startDownload(downloadConfig);
    };

    const handleDownloadAttachment = (item, attachment) => {
        let filename = '';
        let url = '';
        let size = undefined;
        
        switch(item.type) {
          case 'outlook':
            filename = `${attachment.name}.zip`;
            url = `/archive/s3/download_v2?s3Key=${attachment.s3Key}&filename=${attachment.name}`;
            size = attachment.size;
            break;
          case 'gmail':
            filename = `${attachment.filename}.zip`;
            url = `/archive/s3/download_v2?s3Key=${attachment.s3Key}&filename=${attachment.filename}`;
            size = attachment.size;
            break;
          case 'slack':
            filename = `${attachment.name}.zip`;
            url = `/archive/s3/download_v2?s3Key=${attachment.s3Key}&filename=${attachment.name}`;
            size = attachment.size;
            break;
        }
        
        let downloadConfig = {
          type: 'FlaggedCollections',
          isArchive: true, 
          name: filename,
          id: Date.now(), 
          url,
          size, 
          responseType: 'blob',
        };
        startDownload(downloadConfig);
    };

    const handleBulkDownload = async () => {
        setLoadingBulkDownload(true);
        const messageIds = rows
            .filter((item) => selected.includes(item.id))
            .map((item) => item.data.id || item.data.ts);
        
        try {
            if (messageIds.length > 0) {
                startDownload({
                  type: 'Outlook', 
                  isArchive: false,   
                  name: `flagged_bulk_download_${new Date().toISOString()}.zip`, 
                  id: Date.now(), 
                  url: `/archive/flagged-collections/${archiveId}/bulkDownload`, 
                  size: undefined,
                  responseType: 'blob',
                  axiosType: 'POST',
                  postData: { messageIds }
                });
            }
        } catch (error) {
            console.error('Bulk download failed:', error);
        } finally {
            setLoadingBulkDownload(false);
        }
    };

    const isSelected = (id) => selected.indexOf(id) !== -1;

    const handleRowClick = (event, item) => {
        setSelectedItem(item);
        setDetailOpen(true);
    };

    const handleCloseDetail = () => {
        setDetailOpen(false);
        setSelectedItem(null);
    };

    const truncateText = (text, maxLength = 30) => {
        if (!text) return '';
        if (text.length > maxLength) {
            return `${text.substring(0, maxLength)}...`;
        }
        return text;
    };

    const sanitizeEmailHTML = (html) => {
        if (!html) return '';
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
    
        doc.querySelectorAll('script, style, iframe, frame').forEach(el => el.remove());
        
        return doc.body.innerHTML;
    };

    // Search functionality
    const handleOpenDialog = (open) => {
        setSearchOpen(open);
    };

    const handleSearchSubmit = (searchParams) => {
        setCurrentSearch(searchParams);
        applySearchFilters(searchParams);
    };

    const handleClearSearch = () => {
        setCurrentSearch({});
        setRows(originalRows);
    };

    const handleKeywordsChange = (keywords) => {
        setCurrentSearch(prev => ({ ...prev, keywords }));
    };

    const applySearchFilters = (searchParams) => {
        let filtered = originalRows.filter(row => {
            // Keyword search
            if (searchParams.keywords) {
                const keywordMatch = Object.values(row).some(
                    val => val && val.toString().toLowerCase().includes(searchParams.keywords.toLowerCase())
                );
                if (!keywordMatch) return false;
            }
            
            // Date range filter
            if (searchParams.dateRange?.start || searchParams.dateRange?.end) {
                const rowDate = new Date(row.date);
                const startDate = searchParams.dateRange.start ? new Date(searchParams.dateRange.start) : null;
                const endDate = searchParams.dateRange.end ? new Date(searchParams.dateRange.end) : null;
                
                if (startDate && rowDate < startDate) return false;
                if (endDate && rowDate > endDate) return false;
            }
            
            // File type filter
            if (searchParams.fileTypePattern && (row.source === 'OneDrive' || row.source === 'Google Drive' || row.source === 'Dropbox')) {
                const fileTypes = searchParams.fileTypePattern.split(',').map(t => t.trim().replace('*.', ''));
                const fileExt = row.name?.split('.').pop();
                if (!fileTypes.includes(fileExt)) return false;
            }
            
            // Size range filter
            if (searchParams.sizeRange) {
                const [min, max] = searchParams.sizeRange.split('-').map(Number);
                const rowSize = parseFloat(row.size?.split(' ')[0]);
                
                if (min && rowSize < min) return false;
                if (max && rowSize > max) return false;
            }
            
            // Email filters
            if (searchParams.emailFilters) {
                if (searchParams.emailFilters.from && row.from) {
                    if (!row.from.toLowerCase().includes(searchParams.emailFilters.from.toLowerCase())) {
                        return false;
                    }
                }
                if (searchParams.emailFilters.to && row.to) {
                    if (!row.to.toLowerCase().includes(searchParams.emailFilters.to.toLowerCase())) {
                        return false;
                    }
                }
            }
            
            return true;
        });
        
        setRows(filtered);
    };

    const filteredRows = filter === 'all' 
        ? rows 
        : rows.filter(row => row.source === filter);

    // Pagination
    const itemsPerPage = 10;
    const pageCount = Math.ceil(filteredRows.length / itemsPerPage);
    const paginatedRows = filteredRows.slice(
        (page - 1) * itemsPerPage,
        page * itemsPerPage
    );

    return (
        <MainCard sx={{ minHeight: '66vh' }} title={title} backButton>
            <Box>
                <Grid container alignItems='center' spacing={2}>
                    <Grid item xs={12} sm={3}>
                        <FormControl fullWidth>
                            <InputLabel>Filter by source</InputLabel>
                            <Select
                                value={filter}
                                onChange={(e) => setFilter(e.target.value)}
                                label="Filter by source"
                            >
                                <MenuItem value="all">All Sources</MenuItem>
                                <MenuItem value="OneDrive">OneDrive</MenuItem>
                                <MenuItem value="Slack">Slack</MenuItem>
                                <MenuItem value="Outlook">Outlook</MenuItem>
                                <MenuItem value="Gmail">Gmail</MenuItem>
                                <MenuItem value="Google Drive">Google Drive</MenuItem>
                                <MenuItem value="Dropbox">Dropbox</MenuItem>
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <SearchBox 
                            handleSearch={(keywords) => handleSearchSubmit({ keywords })}
                            handleOpenDialog={handleOpenDialog}
                            currentSearch={currentSearch}
                            onClearSearch={handleClearSearch}
                            onKeywordsChange={handleKeywordsChange}
                        />
                    </Grid>
                </Grid>
            </Box>
            
            {loading && <LinearProgress />}
            
            <Box sx={{ width: '100%', overflow: 'auto', mt: 2 }}>
                <TableContainer component={Paper}>
                    <Table size='small' aria-labelledby='tableTitle' stickyHeader>
                        <EnhancedTableHead
                            numSelected={selected.length}
                            order={order}
                            orderBy={orderBy}
                            onSelectAllClick={handleSelectAllClick}
                            onRequestSort={handleRequestSort}
                            rowCount={paginatedRows.length}
                            selected={selected}
                            handleBulkDownload={handleBulkDownload}
                            loadingBulkDownload={loadingBulkDownload}
                        />
                        <TableBody>
                            {paginatedRows.map((row, index) => {
                                const isItemSelected = isSelected(row.id);
                                const labelId = `enhanced-table-checkbox-${index}`;

                                return (
                                    <TableRow
                                        hover
                                        role='checkbox'
                                        aria-checked={isItemSelected}
                                        tabIndex={-1}
                                        key={row.id}
                                        selected={isItemSelected}
                                    >
                                        <TableCell padding='checkbox' onClick={(event) => handleClick(event, row.id)}>
                                            <Checkbox
                                                color='primary'
                                                checked={isItemSelected}
                                                inputProps={{ 'aria-labelledby': labelId }}
                                            />
                                        </TableCell>
                                        <TableCell>{row.source}</TableCell>
                                        <TableCell>
                                            <Tooltip title={row.name}>
                                                <Typography noWrap>{truncateText(row.name, 20)}</Typography>
                                            </Tooltip>
                                        </TableCell>
                                        <TableCell>
                                            {row.from && (
                                                <Tooltip title={row.from}>
                                                    <Typography noWrap>{truncateText(row.from, 20)}</Typography>
                                                </Tooltip>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            {row.to && (
                                                <Tooltip title={row.to}>
                                                    <Typography noWrap>{truncateText(row.to, 20)}</Typography>
                                                </Tooltip>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            {row.preview && (
                                                <Tooltip title={row.preview}>
                                                    <Typography noWrap>{truncateText(row.preview, 20)}</Typography>
                                                </Tooltip>
                                            )}
                                        </TableCell>
                                        <TableCell align='center'>
                                            <Tooltip title={row.date}>
                                                <Typography noWrap>{truncateText(row.date, 10)}</Typography>
                                            </Tooltip>
                                        </TableCell>
                                        <TableCell>{row.size}</TableCell>
                                        <TableCell>
                                            {row.attachmentsCount ? (
                                                <Box>
                                                {row.attachments.map((attachment, idx) => (
                                                    <Typography 
                                                    key={idx}
                                                    sx={{ 
                                                        cursor: 'pointer', 
                                                        textDecoration: 'underline',
                                                        fontSize: '0.8rem',
                                                        '&:hover': { color: 'primary.main' }
                                                    }}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleDownloadAttachment(row, attachment);
                                                    }}
                                                    >
                                                    {truncateText(attachment.name || attachment.filename || attachment.title, 15)}
                                                    </Typography>
                                                ))}
                                                </Box>
                                            ) : (
                                                'No'
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <Box display='flex' justifyContent='center' alignItems='center'>
                                                {/* {row.downloadUrl && ( */}
                                                    <IconButton 
                                                        color='primary' 
                                                        onClick={() => handleDownload(row)}
                                                        size="small"
                                                    >
                                                        <DownloadIcon fontSize="small" />
                                                    </IconButton>
                                                {/* )} */}
                                                <IconButton 
                                                    onClick={() => handleRowClick(null, row)}
                                                    size="small"
                                                >
                                                    <VisibilityIcon fontSize="small" />
                                                </IconButton>
                                            </Box>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Box>
            
            <Box sx={{ p: 2, textAlign: 'right' }}>
                <Pagination 
                    count={pageCount} 
                    page={page} 
                    onChange={handleChangePage} 
                    color="primary"
                    showFirstButton
                    showLastButton
                />
            </Box>
            
            {/* Detail Dialog */}
            <Dialog 
                open={detailOpen} 
                onClose={handleCloseDetail} 
                fullWidth 
                maxWidth='md'
                sx={{
                    '& .MuiDialog-paper': {
                        maxHeight: '80vh'
                    }
                }}
            >
                <DialogTitle>
                    {selectedItem?.source} Details
                    <Typography variant="subtitle2" color="text.secondary">
                        Type: {selectedItem?.type}
                    </Typography>
                </DialogTitle>
                {selectedItem && (
                    <DialogContent dividers>
                        <Grid container spacing={2}>
                            {selectedItem.from && (
                                <Grid item xs={12} sm={6}>
                                    <Typography variant="subtitle1">From:</Typography>
                                    <Typography>{selectedItem.from}</Typography>
                                </Grid>
                            )}
                            {selectedItem.to && (
                                <Grid item xs={12} sm={6}>
                                    <Typography variant="subtitle1">To:</Typography>
                                    <Typography>{selectedItem.to}</Typography>
                                </Grid>
                            )}
                            {selectedItem.name && (
                                <Grid item xs={12}>
                                    <Typography variant="subtitle1">Name/Subject:</Typography>
                                    <Typography>{selectedItem.name}</Typography>
                                </Grid>
                            )}
                            {selectedItem.date && (
                                <Grid item xs={12} sm={6}>
                                    <Typography variant="subtitle1">Date:</Typography>
                                    <Typography>{selectedItem.date}</Typography>
                                </Grid>
                            )}
                            {selectedItem.size && (
                                <Grid item xs={12} sm={6}>
                                    <Typography variant="subtitle1">Size:</Typography>
                                    <Typography>{selectedItem.size}</Typography>
                                </Grid>
                            )}
                            {selectedItem.path && (
                                <Grid item xs={12}>
                                    <Typography variant="subtitle1">Path:</Typography>
                                    <Typography>{selectedItem.path}</Typography>
                                </Grid>
                            )}
                            {selectedItem.preview && (
                                <Grid item xs={12}>
                                    <Typography variant="subtitle1">Preview:</Typography>
                                    <Typography>{selectedItem.preview}</Typography>
                                </Grid>
                            )}
                            {selectedItem.content && (
                                <Grid item xs={12}>
                                    <Typography variant="subtitle1">Content:</Typography>
                                    <Box 
                                        sx={{ 
                                            border: '1px solid #eee', 
                                            p: 2, 
                                            borderRadius: 1,
                                            maxHeight: '300px',
                                            overflow: 'auto'
                                        }}
                                    >
                                        <Typography
                                            variant="body1"
                                            dangerouslySetInnerHTML={{ __html: sanitizeEmailHTML(selectedItem.content) }}
                                        />
                                    </Box>
                                </Grid>
                            )}
                            <Grid item xs={12}>
                                <Typography variant="subtitle1">Attachments:</Typography>
                                {selectedItem.attachmentsCount ? (
                                    <Box>
                                    {selectedItem.attachments.map((attachment, idx) => (
                                        <Typography 
                                        key={idx}
                                        sx={{ 
                                            cursor: 'pointer', 
                                            textDecoration: 'underline',
                                            fontSize: '0.8rem',
                                            '&:hover': { color: 'primary.main' }
                                        }}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleDownloadAttachment(selectedItem, attachment);
                                        }}
                                        >
                                        {truncateText(attachment.name || attachment.filename || attachment.title, 15)}
                                        </Typography>
                                    ))}
                                    </Box>
                                ) : (
                                    'No'
                                )}
                            </Grid>
                        </Grid>
                    </DialogContent>
                )}
                <DialogActions>
                    {selectedItem?.downloadUrl && (
                        <Button 
                            startIcon={<DownloadIcon />}
                            onClick={() => {
                                handleDownload(selectedItem);
                                handleCloseDetail();
                            }}
                        >
                            Download
                        </Button>
                    )}
                    <Button onClick={handleCloseDetail}>Close</Button>
                </DialogActions>
            </Dialog>

            {/* Advanced Search Dialog */}
            <SimpleSearchDialog
                open={searchOpen}
                onClose={() => handleOpenDialog(false)}
                onSubmit={handleSearchSubmit}
                isEmail={filter === 'Outlook' || filter === 'Gmail'}
                isFile={filter === 'OneDrive' || filter === 'Google Drive' || filter === 'Dropbox'}
            />
        </MainCard>
    );
};

ArchiveFlaggedCollections.propTypes = {
    workspaceId: PropTypes.string.isRequired,
    userId: PropTypes.string.isRequired
};

export default ArchiveFlaggedCollections;