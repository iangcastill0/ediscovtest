import PropTypes from 'prop-types';
import React, { useState, useEffect } from 'react';
import {
    Box,
    Checkbox,
    Grid,
    InputAdornment,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TableSortLabel,
    TextField,
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
    CircularProgress
} from '@mui/material';
import { visuallyHidden } from '@mui/utils';
import MainCard from 'ui-component/cards/MainCard';
import VisibilityIcon from '@mui/icons-material/Visibility';
import DownloadIcon from '@mui/icons-material/Download';
import SearchIcon from '@mui/icons-material/Search';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import axios from 'utils/axios';
import { formatSizeUnits } from 'utils/apiHelper';
import useDownload from 'hooks/useDownload';
import SearchBox from 'ui-component/extended/SearchBox';
import SimpleSearchDialog from 'ui-component/extended/SimpleSearchDialog';
import Flag from 'ui-component/extended/Flag';
import { getStoredCollectionMap } from 'utils/apiHelper';

const headCells = [
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
      id: 'subject',
      numeric: false,
      label: 'Subject',
      align: 'left'
    },
    {
      id: 'preview',
      numeric: true,
      label: 'Preview',
      align: 'left'
    },
    {
      id: 'receivedDateTime',
      numeric: false,
      label: 'Received Date',
      align: 'center'
    },
    {
        id: 'sentDateTime',
        numeric: false,
        label: 'Sent Date',
        align: 'center'
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
    handleExport,
    handleExportPDF,
    handleExportJSON,
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
            <TableCell padding='none' colSpan={6}>
              <EnhancedTableToolbar
                numSelected={selected.length}
                handleExport={handleExport}
                handleExportPDF={handleExportPDF}
                handleExportJSON={handleExportJSON}
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
    handleExport: PropTypes.func.isRequired,
    handleExportPDF: PropTypes.func.isRequired,
    handleExportJSON: PropTypes.func.isRequired,
    handleBulkDownload: PropTypes.func.isRequired,
    loadingBulkDownload: PropTypes.bool.isRequired
  };

  const EnhancedTableToolbar = ({ numSelected,handleBulkDownload, loadingBulkDownload }) => (
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
          <Button variant='contained' color='secondary' startIcon={loadingBulkDownload ? <CircularProgress size={24} /> : <FileDownloadIcon />} onClick={handleBulkDownload} disabled={loadingBulkDownload}>
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

const MessageTable = ({ workspaceId, userId, folder }) => {
    const [page, setPage] = useState(1);
    const [rows, setRows] = React.useState([]);
    const [order, setOrder] = useState('asc');
    const [orderBy, setOrderBy] = useState('receivedDateTime');
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState({});
    const [selected, setSelected] = useState([]);
    const [detailOpen, setDetailOpen] = useState(false);
    const [selectedEmail, setSelectedEmail] = useState(null);
    const [loadingBulkDownload, setLoadingBulkDownload] = React.useState(false);
    const [isSearchActive, setIsSearchActive] = React.useState(false);
    const [totalCount, setTotalCount] = React.useState(folder?.itemCount || 0);
    const [advancedSearchOpen, setAdvancedSearchOpen] = React.useState(false);
    const [currentSearchParams, setCurrentSearchParams] = useState(null);
    const [flagCollections, setFlagCollections] = React.useState([])
    const [storedCollectionMap, setStoredCollectionMap] = React.useState({})
    const { startDownload } = useDownload();

    useEffect(() => {
        const fetchMessages = async () => {
            setLoading(true);

            const rep = await axios.get('/flagged-collections/collectionList')
            const storedCollectionsMap = await getStoredCollectionMap('outlook')
            const flaggedCollections = rep.data?.data || []
            setFlagCollections(flaggedCollections)
            setStoredCollectionMap(storedCollectionsMap)

            try {
              const queryString = Object.entries(searchQuery)
              .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
              .join('&');
                const response = await axios.get(`/ms365/workspace/${workspaceId}/users/${userId}/outlook/folders/${folder.id}/messages?page=${page}&${queryString}`);
                setTotalCount(response.data.totalCount)
                const batch = response.data.messages.map((message) => ({
                    workspaceId,
                    userEmail: userId,
                    id: message.id,
                    from: `${message.from.emailAddress.name} (${message.from.emailAddress.address})`,
                    subject: message.subject,
                    content: message.body?.content,
                    preview: message.bodyPreview,
                    receivedDateTime: new Date(message.receivedDateTime).toLocaleString(),
                    to: renderRecipients(message.toRecipients),
                    toRecipients: message.toRecipients,
                    sender: message.from,
                    sentDateTime: message.sentDateTime,
                    hasAttachments: message.hasAttachments,
                    attachments: message.hasAttachments ? message.attachments : [],
                    detailLink: `/message/${message.id}?$expand=attachments`
                }));
                setRows(batch);
            } catch (error) {
                console.error('Error fetching messages:', error);
            }
            setLoading(false);
        };

        if (folder) 
            fetchMessages();
    }, [page, isSearchActive, folder]);

    useEffect(() => {
      if (page !== 1) {
        setPage(1)
      }
    }, [folder])

    const handleClearSearch = () => {
      setSearchQuery({});
      setCurrentSearchParams(null);
      setIsSearchActive(!isSearchActive);
    };

    const handleAttachmentDownload = async (attachment, workspaceId) => {
      try {
        startDownload({type: 'Outlook', isArchive: false, name: `${attachment.name}.zip`, id: Date.now(), url: `/ms365/${workspaceId}/outlook/${attachment.userId}/messages/${attachment.messageId}/attachments/${attachment.id}/downloadAttachment?fileName=${attachment.name}`, size: attachment.size, responseType: 'blob'})
      } catch (error) {
        console.error('Error downloading attachment:', error);
      }
    };
  
    // Helper function to render attachment details with download links
    const renderAttachments = (attachments, workspaceId) =>
      attachments?.map((attachment, index) => (
        <div key={index}>
          <Typography
            color='primary'
            style={{ textDecoration: 'underline', cursor: 'pointer' }}
            onClick={() => handleAttachmentDownload({ ...attachment, messageId: attachment.messageId }, workspaceId)}
          >
            {attachment.name}
          </Typography>
          <Typography>{`(${formatSizeUnits(attachment.size)})`}</Typography>
        </div>
      ));
    
    // Helper function to render the 'to' recipients
    const renderRecipients = (recipients) =>
      recipients?.map((recipient, index) => (
        `${recipient.emailAddress.name} (${recipient.emailAddress.address})`
      )).join(',');
    
    // Helper function to truncate text
    const truncateText = (text, maxLength = 30) => {
      if (text?.length > maxLength) {
        return `${text.substring(0, maxLength)}...`;
      }
      return text;
    };

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
    
    const handleChangePage = async (event, newPage) => {
        setPage(newPage);
    };
    
    const handleDownload = (message, filename) => {
        startDownload({
          type: 'Outlook', 
          isArchive: false, 
          name: filename, 
          id: Date.now(), 
          url: `/ms365/${workspaceId}/outlook/${userId}/download`, 
          size: undefined, 
          responseType: 'blob',
          axiosType: 'POST',
          postData: {message}
        })
    };
    
    const handleSearch = (text) => {
        setSearchQuery({keywords: text})
        setCurrentSearchParams({keywords: text})
        setIsSearchActive(!isSearchActive);
    };
    
    const handleBulkDownload = async () => {
      console.log(selected)
        const messages = rows.filter((message) => selected.indexOf(message.id) > -1);
        startDownload({
          type: 'Outlook', 
          isArchive: false, 
          name: `${userId}_${new Date().toISOString()}.zip`, 
          id: Date.now(), 
          url: `/ms365/${workspaceId}/outlook/${userId}/bulkDownload_v2`, 
          size: undefined, 
          responseType: 'blob',
          axiosType: 'POST',
          postData: {messageIds: selected}
        })
    };
    
    const isSelected = (id) => selected.indexOf(id) !== -1;
    
    const handleRowClick = (event, email) => {
        setSelectedEmail(email);
        setDetailOpen(true);
    };
    
    const handleCloseDetail = () => {
        setDetailOpen(false);
        setSelectedEmail(null);
    };

    const handleKeywordsChange = (keywords) => {
      setCurrentSearchParams(prev => ({
          ...prev,
          keywords
      }));
  };

    const handleAdvancedSearch = (searchParams) => {
        // Implement advanced search logic here
        console.log('Advanced search params:', searchParams);
      const searchObj = {keywords: searchParams.keywords}
      if (searchParams.dateRange.start) {
          searchObj.start = searchParams.dateRange.start.toLocaleDateString('en-CA')
      }
      if (searchParams.dateRange.end) {
        searchObj.end = searchParams.dateRange.end.toLocaleDateString('en-CA')
      }
      if (searchParams.emailFilters.from !== '') {
        searchObj.from = searchParams.emailFilters.from
      }
      if (searchParams.emailFilters.to !== '') {
        searchObj.to = searchParams.emailFilters.to
      }
        // You can combine the search params with your existing search logic
        setSearchQuery(searchObj);
        setCurrentSearchParams(searchParams);
        setIsSearchActive(!isSearchActive);
        setAdvancedSearchOpen(false);
    };

    const sanitizeEmailHTML = (html) => {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
      
        // Remove dark mode styles
        doc.querySelectorAll('style').forEach((styleTag) => {
          if (styleTag.textContent.includes('@media') || styleTag.textContent.includes('dark')) {
            styleTag.remove();
          }
        });
      
        return doc.body.innerHTML;
    };
      
    return (
        <MainCard sx={{minHeight: '66vh'}}>
          <Box>
            <Grid container alignItems='center'>
              <Grid item xs>
                <Typography variant='h4'>Messages</Typography>
              </Grid>
              <Grid item>
                <SearchBox 
                  handleSearch={handleSearch}
                  handleOpenDialog={setAdvancedSearchOpen}
                  currentSearch={currentSearchParams}
                  onClearSearch={handleClearSearch}
                  onKeywordsChange={handleKeywordsChange}
                />
              </Grid>
            </Grid>
          </Box>
          {loading && <LinearProgress />}
          <Box sx={{ width: '100%', overflow: 'auto'}}>
            <TableContainer component={Paper} >
              <Table size='small' aria-labelledby='tableTitle' stickyHeader>
                <EnhancedTableHead
                  numSelected={selected.length}
                  order={order}
                  orderBy={orderBy}
                  onSelectAllClick={handleSelectAllClick}
                  onRequestSort={handleRequestSort}
                  rowCount={rows.length}
                  selected={selected}
                  handleBulkDownload={handleBulkDownload}
                  loadingBulkDownload={loadingBulkDownload}
                />
                <TableBody>
                    {rows.map((row, index) => {
                        const isItemSelected = isSelected(row.id);
                        const labelId = `enhanced-table-checkbox-${index}`;
                        row.workspaceId = workspaceId;
                        row.userId =  userId;

                        return (
                        <TableRow
                            hover
                            role='checkbox'
                            aria-checked={isItemSelected}
                            tabIndex={-1}
                            key={row.id}
                            selected={isItemSelected}
                            sx={{ maxHeight: '100px' }}
                        >
                            <TableCell padding='none'>
                              <Flag
                                  rowId={row.id}
                                  type="outlook"
                                  collections={flagCollections}
                                  rowData={row}
                                  initialFlag={flagCollections.find((e) => e._id === storedCollectionMap[row.id])}
                              />
                            </TableCell>
                            <TableCell onClick={(event) => handleClick(event, row.id)} padding='none'>
                              <Checkbox
                                  color='primary'
                                  checked={isItemSelected}
                                  inputProps={{
                                  'aria-labelledby': labelId
                                  }}
                              />
                            </TableCell>
                            <TableCell component='th' id={labelId} scope='row' padding='none'>
                            <Tooltip title={row.from}>
                                <Typography noWrap>
                                {truncateText(row.from, 20)}
                                </Typography>
                            </Tooltip>
                            </TableCell>
                            <TableCell component='th' id={labelId} scope='row' padding='none'>
                            <Tooltip title={row.to}>
                                <Typography noWrap>
                                    {truncateText(row.to, 20)}
                                </Typography>
                            </Tooltip>
                            </TableCell>
                            <TableCell align='left'>
                            <Tooltip title={row.subject}>
                                <Typography noWrap>
                                {truncateText(row.subject, 20)}
                                </Typography>
                            </Tooltip>
                            </TableCell>
                            <TableCell align='left'>
                            <Tooltip title={row.preview}>
                                <Typography noWrap style={{ maxWidth: '150px' }}>
                                {truncateText(row.preview, 20)}
                                </Typography>
                            </Tooltip>
                            </TableCell>
                            <TableCell align='center'>
                            <Tooltip title={row.receivedDateTime}>
                                <Typography noWrap>
                                {truncateText(row.receivedDateTime, 10)}
                                </Typography>
                            </Tooltip>
                            </TableCell>
                            <TableCell align='center'>
                            <Tooltip title={row.sentDateTime}>
                                <Typography noWrap>
                                {truncateText(row.sentDateTime, 10)}
                                </Typography>
                            </Tooltip>
                            </TableCell>
                            <TableCell align='left' padding='none'>{renderAttachments(row.attachments.map((att) => ({ ...att, userId, messageId: row.id })), workspaceId)}</TableCell>
                            <TableCell align='left' padding='none'>
                            <Box display='flex' justifyContent='center' alignItems='center'>
                                <IconButton color='primary' onClick={() => handleDownload(row, `${truncateText(row.subject, 30).replace(/[^a-z0-9]/gi, '_').toLowerCase() || 'no_subject'}.zip`)}>
                                <DownloadIcon />
                                </IconButton>
                                <IconButton onClick={() => handleRowClick(null, row)}>
                                <VisibilityIcon />
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
            <Pagination count={Math.ceil(totalCount / 10)} page={page} onChange={handleChangePage} />
          </Box>
          <Dialog open={detailOpen} onClose={handleCloseDetail} aria-labelledby='email-detail-dialog' fullWidth maxWidth='md'>
            <DialogTitle id='email-detail-dialog'>Email Details</DialogTitle>
            {selectedEmail && (
              <DialogContent dividers>
                <Typography variant='h6'>From: {selectedEmail.from}</Typography>
                <Typography variant='h6'>To: {selectedEmail.to}</Typography>
                <Typography variant='h6'>Subject: {selectedEmail.subject}</Typography>
                <Typography variant='h6'>Received: {selectedEmail.receivedDateTime}</Typography>
                <Typography
                  variant="body1"
                  dangerouslySetInnerHTML={{ __html: sanitizeEmailHTML(selectedEmail.content) }}
                />
                <Typography variant='h6'>Attachments: {renderAttachments(selectedEmail.attachments.map((att) => ({ ...att, userId, messageId: selectedEmail.id })), workspaceId)}</Typography>
              </DialogContent>
            )}
            <DialogActions>
              <Button onClick={handleCloseDetail} color='primary'>
                Close
              </Button>
            </DialogActions>
          </Dialog>
          <SimpleSearchDialog 
            open={advancedSearchOpen} 
            onClose={() => setAdvancedSearchOpen(false)} 
            onSubmit={handleAdvancedSearch}
            isEmail={true}
          />
        </MainCard>
      );
};

MessageTable.propTypes = {
    workspaceId: PropTypes.string.isRequired,
    userId: PropTypes.string.isRequired,
    folder: PropTypes.object.isRequired
};

export default MessageTable;