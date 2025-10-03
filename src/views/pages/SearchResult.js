import PropTypes from 'prop-types';
import * as React from 'react';
import axiosServices from 'utils/axios';
import { useTheme } from '@mui/material/styles';
import {
    Box,
    CardContent,
    Checkbox,
    Grid,
    InputAdornment,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TablePagination,
    TableRow,
    TableSortLabel,
    TextField,
    Typography,
    FormControlLabel,
    LinearProgress,
    CardMedia,
    CircularProgress,
    Badge,
    styled,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Tooltip,
    Paper,
    IconButton,
    Toolbar
} from '@mui/material';
import { visuallyHidden } from '@mui/utils';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSlack } from '@fortawesome/free-brands-svg-icons';
import MainCard from 'ui-component/cards/MainCard';
import SearchIcon from '@mui/icons-material/Search';
import { DatePicker } from '@mui/x-date-pickers';
import Carousel, { Modal, ModalGateway } from 'react-images';
import { useNavigate } from 'react-router-dom';
import { searchAll, getSlackImage, emojis, getOutlookContent, getGmailContent, getArchiveOutlookDownload, getArchiveOutlookSearchBulkDownload, downloadArchiveOnedrive, downloadArchiveGmail, bulkDownloadGmailFromSearch, downloadArchiveGmailAttachment, downloadArchiveOutlookAttachment } from 'utils/apiHelper';
import VisibilityIcon from '@mui/icons-material/Visibility';
import DownloadIcon from '@mui/icons-material/Download';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import { downloadGmailAsEml, formatSizeUnits } from 'utils/utils';
import useDownload from 'hooks/useDownload';

const OutlinedBadge = styled(Badge)(({ theme }) => ({
    '& .MuiBadge-badge': {
        background: theme.palette.background.paper,
        color: theme.palette.primary.main,
        border: `1px solid ${theme.palette.primary.main}`,
        padding: '0 4px'
    }
}));

const slackHeadCells = [
    { id: 'message', numeric: false, label: 'Messages', align: 'left' },
    { id: 'startedBy', numeric: false, label: 'Started By', align: 'left' },
    { id: 'workspace', numeric: false, label: 'Workspace', align: 'left' },
    { id: 'channel', numeric: false, label: 'Channel', align: 'left' },
    { id: 'created', numeric: false, label: 'Date Created', align: 'left' },
    { id: 'replies', numeric: true, label: 'Replies', align: 'center' },
    { id: 'reactions', numeric: false, label: 'Reactions', align: 'left' }
];

const outlookHeadCells = [
    { id: 'subject', numeric: false, label: 'Subject', align: 'left' },
    { id: 'sender', numeric: false, label: 'Sender', align: 'left' },
    { id: 'toRecipients', numeric: false, label: 'To Recipients', align: 'left' },
    { id: 'createdDateTime', numeric: false, label: 'Created Date', align: 'left' },
    { id: 'receivedDateTime', numeric: false, label: 'Received Date', align: 'left' },
    { id: 'sentDateTime', numeric: false, label: 'Sent Date', align: 'left' },
    { id: 'bodyPreview', numeric: false, label: 'Preview', align: 'left' },
    { id: 'folderPath', numeric: false, label: 'Folder', align: 'left' },
    { id: 'attachments', numeric: false, label: 'Attachments', align: 'left' }, // New Attachments Column
    { id: 'downloadLogs', numeric: false, label: 'Downloads', align: 'center' },
    { id: 'actions', numeric: false, label: 'Actions', align: 'left' },
    { id: 'workspaceName', numeric: false, label: 'Workspace Name', align: 'left' },
    { id: 'archiveName', numeric: false, label: 'Archive Name', align: 'left' },
    { id: 'archiveId', numeric: false, label: 'Archive ID', align: 'left' },
];


const onedriveHeadCells = [
    { id: 'name', numeric: false, label: 'File Name', align: 'left' },
    { id: 'createdBy', numeric: false, label: 'Created By', align: 'left' },
    { id: 'createdDateTime', numeric: false, label: 'Created Date', align: 'left' },
    { id: 'lastModifiedBy', numeric: false, label: 'Last Modified By', align: 'left' },
    { id: 'lastModifiedDateTime', numeric: false, label: 'Last Modified Date', align: 'left' },
    { id: 'size', numeric: false, label: 'Size', align: 'center' },
    { id: 'workspaceName', numeric: false, label: 'Workspace Name', align: 'left' },
    { id: 'archiveName', numeric: false, label: 'Archive Name', align: 'left' },
    { id: 'archiveId', numeric: false, label: 'Archive ID', align: 'left' },
    { id: 'actions', numeric: false, label: 'Actions', align: 'left' },
];

const gmailHeadCells = [
    { id: 'subject', numeric: false, label: 'Subject', align: 'left' },
    { id: 'from', numeric: false, label: 'From', align: 'left' },
    { id: 'to', numeric: false, label: 'To', align: 'left' },
    { id: 'date', numeric: false, label: 'Created Date', align: 'left' },
    { id: 'preview', numeric: false, label: 'Preview', align: 'left' },
    { id: 'attachments', numeric: false, label: 'Attachments', align: 'center' },
    { id: 'actions', numeric: false, label: 'Actions', align: 'left' },
    { id: 'workspaceName', numeric: false, label: 'Workspace Name', align: 'left' },
    { id: 'archiveName', numeric: false, label: 'Archive Name', align: 'left' },
    { id: 'archiveId', numeric: false, label: 'Archive ID', align: 'left' },
];

const googledriveHeadCells = [
    { id: 'name', numeric: false, label: 'File Name', align: 'left' },
    { id: 'createdTime', numeric: false, label: 'Created Time', align: 'left' },
    { id: 'modifiedTime', numeric: false, label: 'Modified Time', align: 'left' },
    { id: 'size', numeric: false, label: 'Size', align: 'center' },
    { id: 'md5Checksum', numeric: false, label: 'MD5 Checksum', align: 'left' },
    { id: 'workspaceName', numeric: false, label: 'Workspace Name', align: 'left' },
    { id: 'archiveName', numeric: false, label: 'Archive Name', align: 'left' },
    { id: 'actions', numeric: false, label: 'Actions', align: 'left' },
];

const dropboxHeadCells = [
    { id: 'name', numeric: false, label: 'File Name', align: 'left' },
    { id: 'mimeType', numeric: false, label: 'Type', align: 'center' },
    { id: 'size', numeric: false, label: 'Size', align: 'center' },
    { id: 'path', numeric: false, label: 'Path', align: 'center' },
    { id: 'md5Checksum', numeric: false, label: 'MD5 Checksum', align: 'left' },
    { id: 'isDeleted', numeric: false, label: 'Deleted', align: 'left' },
    { id: 'createdTime', numeric: false, label: 'Created Time', align: 'left' },
    { id: 'modifiedTime', numeric: false, label: 'Modified Time', align: 'left' },
    { id: 'workspaceName', numeric: false, label: 'Workspace Name', align: 'left' },
    { id: 'archiveName', numeric: false, label: 'Archive Name', align: 'left' },
    { id: 'actions', numeric: false, label: 'Actions', align: 'left' },
];

const filesHeadCells = [
    { id: 'fileName', numeric: false, label: 'File Name', align: 'left' },
    { id: 'fileType', numeric: false, label: 'File Type', align: 'left' },
    { id: 'size', numeric: false, label: 'Size', align: 'center' },
    { id: 'archiveId', numeric: false, label: 'ArchiveId', align: 'center' },
    { id: 'createdAt', numeric: false, label: 'Created Time', align: 'left' },
    { id: 'updatedAt', numeric: false, label: 'Modified Time', align: 'left' },
    { id: 'owner', numeric: false, label: 'Owner', align: 'left' },
    { id: 'actions', numeric: false, label: 'Actions', align: 'left' },
];

const flaggedHeadCells = [
    { id: 'source', numeric: false, label: 'Source', align: 'left' },
    { id: 'name', numeric: false, label: 'Name/Subject', align: 'left' },
    { id: 'from', numeric: false, label: 'From', align: 'left' },
    { id: 'to', numeric: false, label: 'To', align: 'left' },
    { id: 'preview', numeric: true, label: 'Preview', align: 'left' },
    { id: 'date', numeric: false, label: 'Date', align: 'center' },
    { id: 'size', numeric: true, label: 'Size', align: 'left' },
    { id: 'attachments', numeric: true, label: 'Attachments', align: 'left' },
    { id: 'actions', numeric: true, label: 'Actions', align: 'left' },
    { id: 'archiveId', numeric: false, label: 'ArchiveId', align: 'left' },
    { id: 'workspaceName', numeric: false, label: 'WorkspaceName', align: 'left' },
    { id: 'archiveName', numeric: false, label: 'CollectionName', align: 'left' },
];

function EnhancedTableHead({ headCells, onSelectAllClick, order, orderBy, numSelected, rowCount, onRequestSort }) {
    const createSortHandler = (property) => (event) => {
        onRequestSort(event, property);
    };

    return (
        <TableHead>
            <TableRow>
                <TableCell padding="checkbox" sx={{ pl: 3 }}>
                    <Checkbox
                        color="primary"
                        indeterminate={numSelected > 0 && numSelected < rowCount}
                        checked={rowCount > 0 && numSelected === rowCount}
                        onChange={onSelectAllClick}
                        inputProps={{ 'aria-label': 'select all' }}
                    />
                </TableCell>
                {headCells.map((headCell) => (
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
    headCells: PropTypes.array.isRequired,
    numSelected: PropTypes.number.isRequired,
    onRequestSort: PropTypes.func.isRequired,
    onSelectAllClick: PropTypes.func.isRequired,
    order: PropTypes.oneOf(['asc', 'desc']).isRequired,
    orderBy: PropTypes.string.isRequired,
    rowCount: PropTypes.number.isRequired,
};

const renderDownloadButton = (id, downloadFunction, args, isDownloading, downloadProgress) => {
    if (isDownloading[id]) {
        return (
            <Box display="flex" alignItems="center" justifyContent="center">
                <CircularProgress size={24} />
                <Typography variant="body2" sx={{ ml: 1 }}>{Math.round(downloadProgress[id] || 0)}%</Typography>
            </Box>
        );
    }
    
    if (downloadProgress[id] >= 100) {
        return <Typography variant="body2" color="success.main">Downloaded</Typography>;
    }

    return (
        <IconButton color="primary" onClick={() => downloadFunction(...args)}>
            <DownloadIcon />
        </IconButton>
    );
};

const SearchResult = () => {
    const theme = useTheme();
    const [order, setOrder] = React.useState('asc');
    const [orderBy, setOrderBy] = React.useState('message');
    const [selected, setSelected] = React.useState([]);
    const [search, setSearch] = React.useState('');
    const [rows, setRows] = React.useState([]);
    const [originalMessages, setOriginalMessages] = React.useState([]);
    const [startDate, setStartDate] = React.useState(new Date());
    const [endDate, setEndDate] = React.useState(new Date());
    const [filterBy, setFilterBy] = React.useState(false);
    const [loading, setLoading] = React.useState(false);
    const [modal, setModal] = React.useState(false);
    const [images, setImages] = React.useState('');
    const [downloadProgress, setDownloadProgress] = React.useState({});
    const [isDownloading, setDownloading] = React.useState({});
    const [filenames, setFileNames] = React.useState([]);
    const [slackData, setSlackData] = React.useState([]);
    const [outlookData, setOutlookData] = React.useState([]);
    const [oneDriveData, setOneDriveData] = React.useState([]);
    const [gmailData, setGmailData] = React.useState([]);
    const [googleDriveData, setGoogleDriveData] = React.useState([]);
    const [dropboxData, setDropboxData] = React.useState([]);
    const [filesData, setFilesData] = React.useState([]);
    const [selectedType, setSelectedType] = React.useState('');
    const [dialogOpen, setDialogOpen] = React.useState(false);
    const [emailContent, setEmailContent] = React.useState('');
    const [bulkDownloadLoading, setBulkDownloadLoading] = React.useState(false);
    const [logDialogOpen, setLogDialogOpen] = React.useState(false);
    const [downloadLogs, setDownloadLogs] = React.useState([]);

    const [slackPage, setSlackPage] = React.useState(0);
    const [slackRowsPerPage, setSlackRowsPerPage] = React.useState(5);
    const [slackTotalCount, setSlackTotalCount] = React.useState(0);

    const [outlookPage, setOutlookPage] = React.useState(0);
    const [outlookRowsPerPage, setOutlookRowsPerPage] = React.useState(5);
    const [outlookTotalCount, setOutlookTotalCount] = React.useState(0);
    
    const [oneDrivePage, setOneDrivePage] = React.useState(0);
    const [oneDriveRowsPerPage, setOneDriveRowsPerPage] = React.useState(5);
    const [oneDriveTotalCount, setOneDriveTotalCount] = React.useState(0);

    const [gmailPage, setGmailPage] = React.useState(0);
    const [gmailRowsPerPage, setGmailRowsPerPage] = React.useState(5);
    const [gmailTotalCount, setGmailTotalCount] = React.useState(0);

    const [googleDrivePage, setGoogleDrivePage] = React.useState(0);
    const [googleDriveRowsPerPage, setGoogleDriveRowsPerPage] = React.useState(5);
    const [googleDriveTotalCount, setGoogleDriveTotalCount] = React.useState(0);
    
    const [dropboxPage, setDropboxPage] = React.useState(0);
    const [dropboxRowsPerPage, setDropboxRowsPerPage] = React.useState(5);
    const [dropboxTotalCount, setDropboxTotalCount] = React.useState(0);

    const [filesPage, setFilesPage] = React.useState(0);
    const [filesRowsPerPage, setFilesRowsPerPage] = React.useState(5);
    const [filesTotalCount, setFilesTotalCount] = React.useState(0);

    const [flaggedData, setFlaggedData] = React.useState([]);
    const [flaggedPage, setFlaggedPage] = React.useState(0);
    const [flaggedRowsPerPage, setFlaggedRowsPerPage] = React.useState(5);
    const [flaggedTotalCount, setFlaggedTotalCount] = React.useState(0);

    const navigation = useNavigate();
    const { startDownload } = useDownload();
    const params = new URLSearchParams(window.location.search);
    const parameterObj = {};
    const query = params.get('q');
    const type = params.get('type');
    parameterObj.query = query;
    parameterObj.start = params.get('start');
    parameterObj.end = params.get('end');
    parameterObj.from = params.get('from');
    parameterObj.to = params.get('to');
    parameterObj.archives = params.get('archives');
    // console.log('QUERY: ', query);
    console.log('parameterObj:', parameterObj)
    if(params.get('archives')){
        console.log('archives: ', JSON.stringify(params.get('archives').split(','), null, 2));
    }

    const fetchData = async (type, pageNumber, pageSize) => {
        setLoading(true);
        const response = await searchAll(parameterObj, pageNumber, pageSize, type);
        const data = response.data;
        console.log('search data:', data);

        if (type === 'all' || type === 'slack') {
            const newSlackData = data.slack.results.map((e, index) => ({
                index,
                workspace: 'Slack',
                teamName: e._source.teamName,
                channel: e._source.channelId,
                channelName: e._source.channelName,
                message: e._source.message,
                started_by: e._source.startedBy,
                realname: e._source.realname,
                created: e._source.created,
                files: e._source.files,
                replies: e._source.replies,
                teamId: e._source.teamId
            }));
            setSlackData(newSlackData || []);
            setSlackTotalCount(data.slack.total);
        }

        if (type === 'all' || type === 'outlook') {
            const newOutlookData = data.outlook.results.map((e, index) => ({
                index,
                workspace: 'Outlook',
                workspaceName: e.workspaceName,
                subject: e.subject,
                bodyPreview: e.bodyPreview,
                isRead: e.isRead,
                sender: e.sender?.emailAddress.name,
                toRecipients: e.toRecipients,
                createdDateTime: e.createdDateTime,
                receivedDateTime: e.receivedDateTime,
                sentDateTime: e.sentDateTime,
                archiveId: e.archiveId,
                archiveName: e.archiveName,
                id: e.id,
                hash: e.hash,
                downloadLogs: e.downloadLogs,
                hasAttachments: e.hasAttachments,
                attachments:e.attachments,
                folderPath:e.folderPath
            }))
            setOutlookData(newOutlookData || []);
            setOutlookTotalCount(data.outlook.total);
        }

        if (type === 'all' || type === 'onedrive') {
            const newOnedriveData = data.onedrive.results.map((e, index) => ({
                index,
                workspace: 'OneDrive',
                workspaceName: e._source.workspaceName,
                name: e._source.name,
                createdBy: `${e._source.createdBy?.user?.email} - ${e._source.createdBy?.user?.displayName}`,
                createdDateTime: e._source.createdDateTime,
                lastModifiedBy: `${e._source.lastModifiedBy?.user?.email} - ${e._source.lastModifiedBy?.user?.displayName}`,
                lastModifiedDateTime: e._source.lastModifiedDateTime,
                size: e._source.size,
                archiveId: e._source.archiveId,
                archiveName: e._source.archiveName,
                id: e._source.id,
                hash: e._source.hash,
            }));
            console.log("OneDriveData: ", newOnedriveData)
            setOneDriveData(newOnedriveData || []);
            setOneDriveTotalCount(data.onedrive.total);
        }

        if (type === 'all' || type === 'gmail') {
            const newGmailData = data.gmail.results.map((e, index) => ({
                index,
                subject: e._source.subject,
                from: e._source.from,
                to: e._source.to,
                date: e._source.date,
                preview: e._source.preview,
                archiveId: e._source.archiveId,
                archiveName: e._source.archiveName,
                id: e._source.id,
                hash: e._source.hash,
                attachments: e._source.attachments,
                downloadLogs: e._source.downloadLogs,
                body: e._source.body
            }));
            setGmailData(newGmailData || []);
            setGmailTotalCount(data.gmail.total);
        }

        if (type === 'all' || type === 'googledrive') {
            const newGoogleDriveData = data.googledrive.results.map((e, index) => ({
                index,
                workspaceName: e._source.workspaceName,
                name: e._source.name,
                createdTime: e._source.createdTime,
                modifiedTime: e._source.modifiedTime,
                size: e._source.size,
                md5Checksum: e._source.md5Checksum, // Add this line
                thumbnailLink: e._source.thumbnailLink,
                archiveId: e._source.archiveId,
                archiveName: e._source.archiveName,
                s3Key: e._source.s3Key,
                id: e._source.id,
            }));
            setGoogleDriveData(newGoogleDriveData || []);
            setGoogleDriveTotalCount(data.googledrive.total);
        }

        if (type === 'all' || type === 'dropbox') {
            const newDropboxData = data.dropbox.results.map((e, index) => ({
                index,
                workspaceName: e._source.workspaceName,
                name: e._source.name,
                mimeType: e._source.mimeType,
                path: e._source.path,
                createdTime: e._source.createdTime,
                modifiedTime: e._source.modifiedTime,
                s3Key: e._source.s3Key,
                isDeleted: e._source.isDeleted,
                size: e._source.size,
                md5Checksum: e._source.md5Checksum, // Add this line
                archiveId: e._source.archiveId,
                archiveName: e._source.archiveName,
                id: e._source.id,
            }));
            setDropboxData(newDropboxData || []);
            setDropboxTotalCount(data.dropbox.total);
        }

        if (type === 'all' || type === 'files') {
            const newFilesData = data.files.results.map((e, index) => ({
                index,
                workspaceId: e._source.workspaceId,
                fileId: e._source.fileId,
                fileName: e._source.fileName,
                collectedBy: e._source.collectedBy,
                createdAt: e._source.createdAt,
                updatedAt: e._source.updatedAt,
                size: e._source.size,
                archiveId: e._source.archiveId,
                owner: e._source.owner,
                fileType: e._source.fileType,
                s3Key: e._source.s3Key
            }));
            setFilesData(newFilesData || []);
            setFilesTotalCount(data.files.total);
        }

        if (type === 'all' || type === 'flagged') {
            const newFlaggedData = data.flaggedCollections.results.map((e, index) => {
                let name = e._source.data?.subject || e._source.data?.name || e._source.data?.label
                let from = e._source.data?.from || e._source.data?.user || ''
                let to = e._source.data?.toRecipients?.map(r => r.emailAddress?.address).join(', ') || ''
                let attachments = e._source.data.attachments || e._source.data.files
                let date = new Date(e._source.data?.sentDateTime || e._source.data?.ts * 1000 || e._source.data?.modifiedTime || e._source.data?.lastModifiedDateTime || e._source.createdAt?.$date).toLocaleString() 
                if (e._source.type === 'gmail') {
                    name = e._source.data.payload.headers.find(h => h.name === 'Subject')?.value;
                    from = e._source.data.payload.headers.find(h => h.name === 'From')?.value;
                    to = e._source.data.payload.headers.find(h => h.name === 'To')?.value;
                    date = e._source.data.payload.headers.find(h => h.name === 'Date')?.value;
                }
                if (e._source.type === 'googledrive' || e._source.type === 'onedrive' || e._source.type === 'dropbox') {
                    attachments = []
                }
                return {
                    index,
                    source: e._source.type,
                    name,
                    from,
                    to,
                    preview: e._source.data?.preview || e._source.data?.message || e._source.data?.snippet || '',
                    date,
                    size: formatSizeUnits(e._source.data?.size || e._source.data?.sizeEstimate || 0),
                    attachments,
                    type: e._source.type,
                    data: e._source.data,
                    s3Key: e._source.s3Key,
                    id: e._source.id,
                    archiveId: e._source.archiveId,
                    archiveName: e._source.archiveName,
                    workspaceName: e._source.workspaceName,
                    hash: e._source.hash

                }
            });
            setFlaggedData(newFlaggedData || []);
            setFlaggedTotalCount(data.flaggedCollections.total);
        }

        setLoading(false);
    };

    React.useEffect(() => {
        if (query && type && query.length > 0 && type.length > 0) {
            fetchData(type, 0, 10);
        }
    }, [query, type]);

    React.useEffect(() => {
        if (selectedType === 'slack') {
            fetchData('slack', slackPage, slackRowsPerPage);
        } else if (selectedType === 'outlook') {
            fetchData('outlook', outlookPage, outlookRowsPerPage);
        } else if (selectedType === 'onedrive') {
            fetchData('onedrive', oneDrivePage, oneDriveRowsPerPage);
        } else if (selectedType === 'gmail') {
            fetchData('gmail', gmailPage, gmailRowsPerPage);
        } else if (selectedType === 'googledrive') {
            fetchData('googledrive', googleDrivePage, googleDriveRowsPerPage);
        } else if (selectedType === 'dropbox') {
            fetchData('dropbox', dropboxPage, dropboxRowsPerPage);
        } else if (selectedType === 'files') {
            fetchData('files', filesPage, filesRowsPerPage);
        } else if (selectedType === 'flagged') {
            fetchData('flagged', flaggedPage, flaggedRowsPerPage);
        }
    }, [selectedType, slackPage, slackRowsPerPage, outlookPage, outlookRowsPerPage, oneDrivePage, oneDriveRowsPerPage, gmailPage, gmailRowsPerPage, googleDrivePage, googleDriveRowsPerPage, dropboxPage, dropboxRowsPerPage, filesPage, filesRowsPerPage, flaggedPage, flaggedRowsPerPage]);

    React.useEffect(() => {
        if (selectedType === '') {
            if (slackData.length > 0) {
                setSelectedType('slack');
                setRows(slackData);
                setOriginalMessages(slackData);
            } else if (outlookData.length > 0) {
                setSelectedType('outlook');
                setRows(outlookData);
                setOriginalMessages(outlookData);
            } else if (oneDriveData.length > 0) {
                setSelectedType('onedrive');
                setRows(oneDriveData);
                setOriginalMessages(oneDriveData);
            } else if (gmailData.length > 0) {
                setSelectedType('gmail');
                setRows(gmailData);
                setOriginalMessages(gmailData);
            } else if (googleDriveData.length > 0) {
                setSelectedType('googledrive');
                setRows(googleDriveData);
                setOriginalMessages(googleDriveData);
            } else if (dropboxData.length > 0) {
                setSelectedType('dropbox');
                setRows(dropboxData);
                setOriginalMessages(dropboxData);
            } else if (filesData.length > 0) {
                setSelectedType('files');
                setRows(filesData);
                setOriginalMessages(filesData);
            } else if (flaggedData.length > 0) {
                setSelectedType('flagged')
                setRows(flaggedData)
                setOriginalMessages(flaggedData)
            }
        } else if (selectedType === 'slack' && slackData.length > 0) {
            setRows(slackData);
            setOriginalMessages(slackData);
        } else if (selectedType === 'outlook' && outlookData.length > 0) {
            setRows(outlookData);
            setOriginalMessages(outlookData);
        } else if (selectedType === 'onedrive' && oneDriveData.length > 0) {
            setRows(oneDriveData);
            setOriginalMessages(oneDriveData);
        } else if (selectedType === 'gmail' && gmailData.length > 0) {
            setRows(gmailData);
            setOriginalMessages(gmailData);
        } else if (selectedType === 'googledrive' && googleDriveData.length > 0) {
            setRows(googleDriveData);
            setOriginalMessages(googleDriveData);
        } else if (selectedType === 'dropbox' && dropboxData.length > 0) {
            setRows(dropboxData);
            setOriginalMessages(dropboxData);
        } else if (selectedType === 'files' && filesData.length > 0) {
            setRows(filesData);
            setOriginalMessages(filesData);
        } else if (selectedType === 'flagged' && flaggedData.length > 0) {
            setRows(flaggedData);
            setOriginalMessages(flaggedData);
        }

    }, [selectedType, slackData, outlookData, oneDriveData, gmailData, googleDriveData, dropboxData, filesData]);

    const setTotalCount = (length) => {
        if (selectedType === 'slack') {
            setSlackTotalCount(length)
        } else if (selectedType === 'outlook') {
            setOutlookTotalCount(length)
        } else if (selectedType === 'onedrive') {
            setOneDriveTotalCount(length)
        } else if (selectedType === 'gmail') {
            setGmailTotalCount(length)
        } else if (selectedType === 'googledrive') {
            setGoogleDriveTotalCount(length)
        } else if (selectedType === 'dropbox') {
            setDropboxTotalCount(length)
        } else if (selectedType === 'files') {
            setFilesTotalCount(length)
        } else if (selectedType === 'flagged') {
            setFlaggedTotalCount(length)
        }
    }
    const searchBy = (newString) => {
        const newRows = rows.filter((row) => {
            let matches = true;
            const properties = ['message', 'subject', 'bodyPreview', 'name', 'body', 'preview', 'filename'];
            let containsQuery = false;

            properties.forEach((property) => {
                if (row[property]?.toString().toLowerCase().includes(newString.toString().toLowerCase())) {
                    containsQuery = true;
                }
            });

            if (!containsQuery) {
                matches = false;
            }

            if (filterBy) {
                const date = Date.parse(row.created || row.receivedDateTime || row.createdDateTime || row.date || row.createdTime);
                matches = matches && date >= startDate && date <= endDate;
            }

            return matches;
        });
        setRows(newRows);
        setTotalCount(newRows.length)
    };

    const filterDate = (filterBy, startDate, endDate) => {
        if (!filterBy) {
            if (!search) {
                setRows(originalMessages);
                setTotalCount(originalMessages.length)
            } else {
                searchBy(search);
            }
        } else {
            const newRows = originalMessages.filter((msg) => {
                if (search) {
                    let matches = true;
                    const properties = ['message', 'subject', 'bodyPreview', 'name', 'body', 'preview', 'filename'];
                    let containsQuery = false;

                    properties.forEach((property) => {
                        if (msg[property]?.toString().toLowerCase().includes(search.toString().toLowerCase())) {
                            containsQuery = true;
                        }
                    });

                    if (!containsQuery) {
                        matches = false;
                    }

                    const date = Date.parse(msg.created || msg.receivedDateTime || msg.createdDateTime || msg.date || msg.createdTime);
                    matches = matches && date >= startDate && date <= endDate;

                    return matches;
                }

                return Date.parse(msg.created || msg.receivedDateTime || msg.createdDateTime || msg.date || msg.createdTime) >= startDate && Date.parse(msg.created || msg.receivedDateTime || msg.createdDateTime || msg.date || msg.createdTime) <= endDate;
            });
            setRows(newRows);
            setTotalCount(newRows.length)
        }
    };

    const handleSearch = (event) => {
        const newString = event?.target.value;
        setSearch(newString || '');
        if (selectedType === 'slack') {
            setSlackPage(0);
        } else if (selectedType === 'outlook') {
            setOutlookPage(0);
        } else if (selectedType === 'onedrive') {
            setOneDrivePage(0);
        } else if (selectedType === 'gmail') {
            setGmailPage(0);
        } else if (selectedType === 'googledrive') {
            setGoogleDrivePage(0);
        } else if (selectedType === 'dropbox') {
            setDropboxPage(0);
        } else if (selectedType === 'files') {
            setFilesPage(0);
        } else if (selectedType === 'flagged') {
            setFlaggedPage(0);
        }
        if (newString) {
            searchBy(newString);
        } else {
            setRows(originalMessages);
            setTotalCount(originalMessages.length)
        }
    };

    const handleRequestSort = (event, property) => {
        const isAsc = orderBy === property && order === 'asc';
        setOrder(isAsc ? 'desc' : 'asc');
        setOrderBy(property);
    };

    const handleSelectAllClick = (event) => {
        if (event.target.checked) {
            const newSelectedId = rows.map((n) => n.index);
            setSelected(newSelectedId);
            return;
        }
        setSelected([]);
    };

    const handleFilterByDate = (event) => {
        setFilterBy(event.target.checked);
        filterDate(event.target.checked, startDate, endDate);
    };

    const handleClick = (event, name) => {
        const selectedIndex = selected.indexOf(name);
        let newSelected = [];

        if (selectedIndex === -1) {
            newSelected = newSelected.concat(selected, name);
        } else if (selectedIndex === 0) {
            newSelected = newSelected.concat(selected.slice(1));
        } else if (selectedIndex === selected.length - 1) {
            newSelected = newSelected.concat(selected.slice(0, selectedIndex));
        } else if (selectedIndex > 0) {
            newSelected = newSelected.concat(selected.slice(0, selectedIndex), selected.slice(selectedIndex + 1));
        }

        setSelected(newSelected);
    };

    const handleSlackPageChange = (event, newPage) => {
        setSlackPage(newPage);
    };

    const handleSlackRowsPerPageChange = (event) => {
        const newRowsPerPage = parseInt(event.target.value, 10);
        setSlackRowsPerPage(newRowsPerPage);
        setSlackPage(0);
    };

    const handleOutlookPageChange = (event, newPage) => {
        setOutlookPage(newPage);
    };

    const handleOutlookRowsPerPageChange = (event) => {
        const newRowsPerPage = parseInt(event.target.value, 10);
        setOutlookRowsPerPage(newRowsPerPage);
        setOutlookPage(0);
    };

    const handleOneDrivePageChange = (event, newPage) => {
        setOneDrivePage(newPage);
    };

    const handleOneDriveRowsPerPageChange = (event) => {
        const newRowsPerPage = parseInt(event.target.value, 10);
        setOneDriveRowsPerPage(newRowsPerPage);
        setOneDrivePage(0);
    };

    const handleGmailPageChange = (event, newPage) => {
        setGmailPage(newPage);
    };

    const handleGmailRowsPerPageChange = (event) => {
        const newRowsPerPage = parseInt(event.target.value, 10);
        setGmailRowsPerPage(newRowsPerPage);
        setGmailPage(0);
    };

    const handleGoogleDrivePageChange = (event, newPage) => {
        setGoogleDrivePage(newPage);
    };

    const handleGoogleDriveRowsPerPageChange = (event) => {
        const newRowsPerPage = parseInt(event.target.value, 10);
        setGoogleDriveRowsPerPage(newRowsPerPage);
        setGoogleDrivePage(0);
    };

    const handleDropboxPageChange = (event, newPage) => {
        setDropboxPage(newPage);
    };

    const handleDropboxRowsPerPageChange = (event) => {
        const newRowsPerPage = parseInt(event.target.value, 10);
        setDropboxRowsPerPage(newRowsPerPage);
        setDropboxPage(0);
    };

    const handleFilesPageChange = (event, newPage) => {
        setFilesPage(newPage);
    };

    const handleFilesRowsPerPageChange = (event) => {
        const newRowsPerPage = parseInt(event.target.value, 10);
        setFilesRowsPerPage(newRowsPerPage);
        setFilesPage(0);
    };

    const handleFlaggedPageChange = (event, newPage) => {
        setFlaggedPage(newPage);
    };
    
    const handleFlaggedRowsPerPageChange = (event) => {
        const newRowsPerPage = parseInt(event.target.value, 10);
        setFlaggedRowsPerPage(newRowsPerPage);
        setFlaggedPage(0);
    };

    const handleDownload = (teamId, filename, downloadName, fileUrl) => {
        setDownloading({ ...isDownloading, [filename]: true });
        setFileNames([...filenames, filename]);
        axiosServices({
            method: 'GET',
            url: `/slack/download/${teamId}/${filename}?fileUrl=${fileUrl}`,
            responseType: 'blob',
            onDownloadProgress: (progressEvent) => {
                const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                setDownloadProgress((prevState) => ({ ...prevState, [filename]: percentCompleted }));
                if (percentCompleted >= 100) {
                    setDownloading({ ...isDownloading, [filename]: false });
                    setFileNames(filenames.filter((item) => item !== filename));
                }
            }
        })
            .then((response) => {
                const blob = new Blob([response.data], { type: response.headers['content-type'] });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = downloadName;
                a.click();
                URL.revokeObjectURL(url);
                console.log('Responsed');
                setDownloadProgress({ ...downloadProgress, [filename]: 0 });
            })
            .catch((error) => {
                console.error('File download error:', error);
                setDownloadProgress({ ...downloadProgress, [filename]: 0 });
            });
    };

    const handleDownloadFlaggedAttachment = (item, attachment) => {
        let filename = '';
        let url = '';
        let size = undefined;
        
        switch(item.type) {
          case 'outlook':
            filename = attachment.name;
            url = `/archive/s3/download_v2?s3Key=${attachment.s3Key}&filename=${filename}`;
            size = attachment.size;
            break;
          case 'gmail':
            filename = attachment.filename;
            url = `/archive/s3/download_v2?s3Key=${attachment.s3Key}&filename=${filename}`;
            size = attachment.size;
            break;
          case 'slack':
            filename = attachment.name;
            url = `/archive/s3/download_v2?s3Key=${attachment.s3Key}&filename=${filename}`;
            size = attachment.size;
            break;
        }
        
        let downloadConfig = {
          type: 'FlaggedCollections',
          isArchive: true, 
          name: `${filename}.zip`,
          id: Date.now(), 
          url,
          size, 
          responseType: 'blob',
        };
        startDownload(downloadConfig);
    };

    const handleOutlookDownload = async (archiveId, id, filename) => {
        setDownloading({ ...isDownloading, [id]: true });
        await getArchiveOutlookDownload(archiveId, id, filename);
        setDownloading({ ...isDownloading, [id]: false });
    };

    const handleOneDriveDownload = async (archiveId, id, filename) => {
        setDownloading({ ...isDownloading, [id]: true });
        await downloadArchiveOnedrive(archiveId, `${archiveId}/${id}/${filename}`, filename);
        setDownloading({ ...isDownloading, [id]: false });
    };

    const handleGmailDownload = async (archiveId, id, filename) => {
        setDownloading({ ...isDownloading, [id]: true });
        const resp = await downloadArchiveGmail(archiveId, id, filename);
        if (resp?.data?.ok) {
            await downloadGmailAsEml(resp.data.data)
        }
        setDownloading({ ...isDownloading, [id]: false });
    };

    const handleOutlookAttachmentDownload = (archiveId, attachment) => {
        const s3Key = `Outlook/${archiveId}_${attachment.id}`;
        setDownloading({ ...isDownloading, [attachment.id]: true });
        downloadArchiveGmailAttachment(archiveId, s3Key, attachment.name, (progressEvent) => {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setDownloadProgress((prevState) => ({ ...prevState, [attachment.id]: percentCompleted }));
            if (percentCompleted >= 100) {
                setDownloading({ ...isDownloading, [attachment.id]: false });
            }
        })
        .then(() => {
            setDownloadProgress({ ...downloadProgress, [attachment.id]: 0 });
        })
        .catch((error) => {
            console.error('File download error:', error);
            setDownloadProgress({ ...downloadProgress, [attachment.id]: 0 });
            setDownloading({ ...isDownloading, [attachment.id]: false });
        });
    };    

    const handleGmailAttachmentDownload = (archiveId, attachment) => {
        setDownloading({ ...isDownloading, [attachment.attachmentId]: true });
        downloadArchiveGmailAttachment(archiveId, attachment.s3Key, attachment.filename, (progressEvent) => {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setDownloadProgress((prevState) => ({ ...prevState, [attachment.attachmentId]: percentCompleted }));
            if (percentCompleted >= 100) {
                setDownloading({ ...isDownloading, [attachment.attachmentId]: false });
            }
        })
        .then(() => {
            setDownloadProgress({ ...downloadProgress, [attachment.attachmentId]: 0 });
        })
        .catch((error) => {
            console.error('File download error:', error);
            setDownloadProgress({ ...downloadProgress, [attachment.attachmentId]: 0 });
            setDownloading({ ...isDownloading, [attachment.attachmentId]: false });
        });
    };
    

    const handleGoogleDriveDownload = async (archiveId, fileId, fileName) => {
        setDownloading({ ...isDownloading, [fileId]: true });
        try {
            const response = await axiosServices.post(
                `/archive/${archiveId}/googledrive/download`,
                {s3Key: `${archiveId}/${fileId}/${fileName}`},
                {responseType: 'blob'});
            const blob = new Blob([response.data], { type: response.headers['content-type'] });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = fileName;
            a.click();
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Google Drive file download error:', error);
            setDownloading({ ...isDownloading, [fileId]: false });
        } finally {
            setDownloading({ ...isDownloading, [fileId]: false });
        }
    };

    const handleFlaggedDownload = async (item) => {
        let filename = ''
        let url = ''
        let size = undefined
        switch(item.type) {
            case 'outlook':
                filename = `${truncateText(item.data.subject || item.data.id, 30).replace(/[^a-z0-9]/gi, '_')}.zip`
                url = `/archive/flagged-collections/${item.archiveId}/download/${item.type === 'slack' ? item.data.ts : item.data.id}`
                break
            case 'gmail':
                filename = `${truncateText(item.data.id, 30).replace(/[^a-z0-9]/gi, '_')}.zip`
                url = `/archive/flagged-collections/${item.archiveId}/download/${item.type === 'slack' ? item.data.ts : item.data.id}`
                break
            case 'slack':
                filename = `${truncateText(item.data.message, 30).replace(/[^a-z0-9]/gi, '_')}.zip`
                url = `/archive/flagged-collections/${item.archiveId}/download/${item.type === 'slack' ? item.data.ts : item.data.id}`
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

    const handleDropboxDownload = async (s3Key, id, fileName, fileSize) => {
        setDownloading({ ...isDownloading, [id]: true });
        setFileNames([...filenames, id]);
        axiosServices({
            method: 'GET',
            url: `/archive/s3/download?s3Key=${s3Key}&filename=${fileName}`,
            responseType: 'blob',
            onDownloadProgress: (progressEvent) => {
                const total = progressEvent.total === 0 ? fileSize : progressEvent.total
                const percentCompleted = Math.round((progressEvent.loaded * 100) / total);
                setDownloadProgress((prevState) => ({ ...prevState, [id]: percentCompleted }));
                if (percentCompleted >= 100) {
                    setDownloading({ ...isDownloading, [id]: false });
                    setFileNames(filenames.filter((item) => item !== id));
            }
            },
        })
            .then((response) => {
                const blob = new Blob([response.data], { type: response.headers['content-type'] });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = fileName;
                a.click();
                URL.revokeObjectURL(url);
                setDownloadProgress({ ...downloadProgress, [id]: 100 }); // Reset progress after download
            })
            .catch((error) => {
                console.error('File download error:', error);
                setDownloadProgress({ ...downloadProgress, [id]: 0 }); // Reset progress on error
            });
    };

    const handleFilesDownload = async (s3Key, id, fileName, fileSize) => {
        setDownloading({ ...isDownloading, [id]: true });
        setFileNames([...filenames, id]);
        axiosServices({
            method: 'GET',
            url: `/archive/s3/download_v2?s3Key=${s3Key}&filename=${fileName}`,
            responseType: 'blob',
            onDownloadProgress: (progressEvent) => {
                const total = progressEvent.total === 0 ? fileSize : progressEvent.total
                const percentCompleted = Math.round((progressEvent.loaded * 100) / total);
                setDownloadProgress((prevState) => ({ ...prevState, [id]: percentCompleted }));
                if (percentCompleted >= 100) {
                    setDownloading({ ...isDownloading, [id]: false });
                    setFileNames(filenames.filter((item) => item !== id));
            }
            },
        })
            .then((response) => {
                const blob = new Blob([response.data], { type: response.headers['content-type'] });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `${fileName}.zip`;
                a.click();
                URL.revokeObjectURL(url);
                setDownloadProgress({ ...downloadProgress, [id]: 100 }); // Reset progress after download
            })
            .catch((error) => {
                console.error('File download error:', error);
                setDownloadProgress({ ...downloadProgress, [id]: 0 }); // Reset progress on error
            });
    };

    const handleTypeChange = (event) => {
        setSelectedType(event.target.value);
        if (event.target.value === 'slack') {
            setRows(slackData);
            setOriginalMessages(slackData);
        } else if (event.target.value === 'outlook') {
            setRows(outlookData);
            setOriginalMessages(outlookData);
        } else if (event.target.value === 'onedrive') {
            setRows(oneDriveData);
            setOriginalMessages(oneDriveData);
        } else if (event.target.value === 'gmail') {
            setRows(gmailData);
            setOriginalMessages(gmailData);
        } else if (event.target.value === 'googledrive') {
            setRows(googleDriveData);
            setOriginalMessages(googleDriveData);
        } else if (event.target.value === 'dropbox') {
            setRows(dropboxData);
            setOriginalMessages(dropboxData);
        } else if (event.target.value === 'files') {
            setRows(filesData);
            setOriginalMessages(filesData);
        } else if (event.target.value === 'flagged') {
            setRows(flaggedData);
            setOriginalMessages(flaggedData);
        }
    };

    const handleBulkDownload = async () => {
        if (selectedType === 'outlook') {
            setBulkDownloadLoading(true);
            const selectedMessages = rows.filter((row) => selected.includes(row.index));
            const messages = selectedMessages.map((message) => ({
                archiveId: message.archiveId,
                id: message.id,
                filename: `${message.archiveName}_${message.subject.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${message.hash}.eml`
            }));
            await getArchiveOutlookSearchBulkDownload(messages, `${query}_${new Date().toISOString()}.zip`);
            setBulkDownloadLoading(false);
        } else if (selectedType === 'gmail') {
            setBulkDownloadLoading(true);
            const selectedMessages = rows.filter((row) => selected.includes(row.index));
            const messages = selectedMessages.map((message) => ({
                archiveId: message.archiveId,
                id: message.id,
                filename: `${message.archiveName}_${message.subject.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${message.hash}.eml`
            }));
            await bulkDownloadGmailFromSearch(messages, `${query}_${new Date().toISOString()}.zip`);
            setBulkDownloadLoading(false);
        }
    };

    const isSelected = (idx) => selected.indexOf(idx) !== -1;

    const handleOpenDialog = async (archiveId, id, item) => {
        setLoading(true);
        try {
            if (selectedType === 'outlook') {
                const data = await getOutlookContent(archiveId, id);
                setEmailContent(data.body.content);
            } else if (selectedType === 'gmail') {
                const data = await getGmailContent(archiveId, id);
                setEmailContent(data.msg);
            } else if (selectedType === 'flagged') {
                if (item.type === 'slack') {
                    setEmailContent(item.data.message)
                } else if (item.type === 'gmail') {
                    setEmailContent(item.data.html)
                } else if (item.type === 'outlook') {
                    setEmailContent(item.data.content)
                }
            }
        } catch (error) {
            console.error('Failed to fetch email content:', error);
        } finally {
            setLoading(false);
            setDialogOpen(true);
        }
    };

    const handleCloseDialog = () => {
        setDialogOpen(false);
        setEmailContent('');
    };

    const handleOpenLogDialog = (logs) => {
        setDownloadLogs(logs);
        setLogDialogOpen(true);
    };

    const handleCloseLogDialog = () => {
        setLogDialogOpen(false);
        setDownloadLogs([]);
    };

    const truncateText = (text, length = 50) => text?.length > length ? `${text.substring(0, length)}...` : text;

    const getHeadCells = () => {
        if (selectedType === 'slack') return slackHeadCells;
        if (selectedType === 'outlook') return outlookHeadCells;
        if (selectedType === 'onedrive') return onedriveHeadCells;
        if (selectedType === 'gmail') return gmailHeadCells;
        if (selectedType === 'googledrive') return googledriveHeadCells;
        if (selectedType === 'dropbox') return dropboxHeadCells;
        if (selectedType === 'files') return filesHeadCells;
        if (selectedType === 'flagged') return flaggedHeadCells;
        return [];
    };

    const getRowCount = () => {
        if (selectedType === 'slack') return slackTotalCount;
        if (selectedType === 'outlook') return outlookTotalCount;
        if (selectedType === 'onedrive') return oneDriveTotalCount;
        if (selectedType === 'gmail') return gmailTotalCount;
        if (selectedType === 'googledrive') return googleDriveTotalCount;
        if (selectedType === 'dropbox') return dropboxTotalCount;
        if (selectedType === 'files') return filesTotalCount;
        if (selectedType === 'flagged') return flaggedTotalCount;
        return 0;
    };

    const getRowsPerPage = () => {
        if (selectedType === 'slack') return slackRowsPerPage;
        if (selectedType === 'outlook') return outlookRowsPerPage;
        if (selectedType === 'onedrive') return oneDriveRowsPerPage;
        if (selectedType === 'gmail') return gmailRowsPerPage;
        if (selectedType === 'googledrive') return googleDriveRowsPerPage;
        if (selectedType === 'dropbox') return dropboxRowsPerPage;
        if (selectedType === 'files') return filesRowsPerPage;
        if (selectedType === 'flagged') return flaggedRowsPerPage;
        return 5;
    };

    const getPage = () => {
        if (selectedType === 'slack') return slackPage;
        if (selectedType === 'outlook') return outlookPage;
        if (selectedType === 'onedrive') return oneDrivePage;
        if (selectedType === 'gmail') return gmailPage;
        if (selectedType === 'googledrive') return googleDrivePage;
        if (selectedType === 'dropbox') return dropboxPage;
        if (selectedType === 'files') return filesPage;
        if (selectedType === 'flagged') return flaggedPage;
        return 0;
    };

    const handlePageChange = (event, newPage) => {
        if (selectedType === 'slack') handleSlackPageChange(event, newPage);
        if (selectedType === 'outlook') handleOutlookPageChange(event, newPage);
        if (selectedType === 'onedrive') handleOneDrivePageChange(event, newPage);
        if (selectedType === 'gmail') handleGmailPageChange(event, newPage);
        if (selectedType === 'googledrive') handleGoogleDrivePageChange(event, newPage);
        if (selectedType === 'dropbox') handleDropboxPageChange(event, newPage);
        if (selectedType === 'files') handleFilesPageChange(event, newPage);
        if (selectedType === 'flagged') handleFlaggedPageChange(event, newPage);
    };

    const handleRowsPerPageChange = (event) => {
        if (selectedType === 'slack') handleSlackRowsPerPageChange(event);
        if (selectedType === 'outlook') handleOutlookRowsPerPageChange(event);
        if (selectedType === 'onedrive') handleOneDriveRowsPerPageChange(event);
        if (selectedType === 'gmail') handleGmailRowsPerPageChange(event);
        if (selectedType === 'googledrive') handleGoogleDriveRowsPerPageChange(event);
        if (selectedType === 'dropbox') handleDropboxRowsPerPageChange(event);
        if (selectedType === 'files') handleFilesRowsPerPageChange(event);
        if (selectedType === 'flagged') handleFlaggedRowsPerPageChange(event);
    };

    return (
        <MainCard key={query} title="Search Results" content={false} backButton>
            <CardContent>
                <Grid container justifyContent="space-between" alignItems="center" spacing={2}>
                    <Grid item xs={12} sm={3}>
                        <TextField
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <SearchIcon fontSize="small" />
                                    </InputAdornment>
                                )
                            }}
                            onChange={handleSearch}
                            placeholder="Search Messages"
                            value={search}
                            size="small"
                            fullWidth
                        />
                    </Grid>
                    <Grid item xs={12} sm={3}>
                        <FormControl fullWidth>
                            <InputLabel>Type</InputLabel>
                            <Select value={selectedType} onChange={handleTypeChange}>
                                {slackData.length > 0 && <MenuItem value="slack">Slack</MenuItem>}
                                {outlookData.length > 0 && <MenuItem value="outlook">Outlook</MenuItem>}
                                {oneDriveData.length > 0 && <MenuItem value="onedrive">OneDrive</MenuItem>}
                                {gmailData.length > 0 && <MenuItem value="gmail">Gmail</MenuItem>}
                                {googleDriveData.length > 0 && <MenuItem value="googledrive">Google Drive</MenuItem>}
                                {dropboxData.length > 0 && <MenuItem value="dropbox">Dropbox</MenuItem>}
                                {filesData.length > 0 && <MenuItem value="files">Files</MenuItem>}
                                {flaggedData.length > 0 && <MenuItem value="flagged">Flagged Collections</MenuItem>}

                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid item xs={10} sm={2} sx={{ textAlign: 'right' }}>
                        <FormControlLabel
                            control={<Checkbox checked={filterBy} onChange={handleFilterByDate} color="primary" />}
                            label="Filter by"
                        />
                    </Grid>
                    <Grid item xs={6} sm={2} sx={{ textAlign: 'left' }}>
                        <LocalizationProvider dateAdapter={AdapterDateFns}>
                            <DatePicker
                                renderInput={(props) => <TextField {...props} fullWidth helperText="" />}
                                label="Start Date"
                                value={startDate}
                                onChange={(newValue) => {
                                    setStartDate(newValue);
                                    filterDate(filterBy, newValue, endDate);
                                }}
                                disabled={!filterBy}
                            />
                        </LocalizationProvider>
                    </Grid>
                    <Grid item xs={6} sm={2} sx={{ textAlign: 'left' }}>
                        <LocalizationProvider dateAdapter={AdapterDateFns}>
                            <DatePicker
                                renderInput={(props) => <TextField {...props} fullWidth helperText="" />}
                                label="End Date"
                                value={endDate}
                                onChange={(newValue) => {
                                    setEndDate(newValue);
                                    filterDate(filterBy, startDate, newValue);
                                }}
                                disabled={!filterBy}
                            />
                        </LocalizationProvider>
                    </Grid>
                </Grid>
            </CardContent>

            <Toolbar
                sx={{
                    p: 0,
                    pl: 2,
                    pr: 1,
                    ...(selected.length > 0 && {
                        color: (theme) => theme.palette.secondary.main
                    })
                }}
            >
                {selected.length > 0 ? (
                    <Typography color='inherit' variant='subtitle1'>
                        {selected.length} selected
                    </Typography>
                ) : (
                    <Typography variant='h6' id='tableTitle'>
                        No selection
                    </Typography>
                )}
                <Box sx={{ flexGrow: 1 }} />
                {selected.length > 0 && (selectedType === 'outlook' || selectedType === 'gmail') && (
                    <Button
                        variant="contained"
                        color="primary"
                        startIcon={bulkDownloadLoading ? <CircularProgress size={24} /> : <FileDownloadIcon />}
                        onClick={handleBulkDownload}
                        disabled={bulkDownloadLoading}
                    >
                        Bulk Download
                    </Button>
                )}
            </Toolbar>

            <TableContainer component={Paper} sx={{ maxHeight: 440 }}>
                {loading && <LinearProgress />}
                <Table sx={{ minWidth: 750 }} stickyHeader aria-labelledby="tableTitle">
                    <EnhancedTableHead
                        headCells={getHeadCells()}
                        theme={theme}
                        numSelected={selected.length}
                        order={order}
                        orderBy={orderBy}
                        onSelectAllClick={handleSelectAllClick}
                        onRequestSort={handleRequestSort}
                        rowCount={rows.length}
                        selected={selected}
                    />
                    <TableBody>
                        {selectedType === 'slack' && rows.map((row, index) => {
                            const isItemSelected = isSelected(row.index);
                            const labelId = `enhanced-table-checkbox-${index}`;

                            return (
                                <TableRow
                                    hover
                                    role="checkbox"
                                    aria-checked={isItemSelected}
                                    tabIndex={-1}
                                    key={index}
                                    selected={isItemSelected}
                                >
                                    <TableCell padding="checkbox" sx={{ pl: 3 }} onClick={(event) => handleClick(event, row.index)}>
                                        <Checkbox
                                            color="primary"
                                            checked={isItemSelected}
                                            inputProps={{ 'aria-labelledby': labelId }}
                                        />
                                    </TableCell>
                                    <TableCell
                                        component="th"
                                        id={labelId}
                                        scope="row"
                                        sx={{ cursor: 'pointer', color: 'primary' }}
                                    >
                                        <Typography variant="subtitle1" sx={{ color: '#2196f3' }}>
                                            {row.message}
                                            {row.files && row.files.map((file, i) => file.thumb ?
                                                <MainCard content={false} sx={{ m: '0 auto' }} key={i}>
                                                    <CardMedia
                                                        onClick={async (e) => {
                                                            e.stopPropagation();
                                                            setModal(true);
                                                            const data = await getSlackImage(row.files, row.teamId);
                                                            setImages(data);
                                                        }}
                                                        component="img"
                                                        image={file.thumb}
                                                        sx={{ overflow: 'hidden', cursor: 'zoom-in' }}
                                                    />
                                                </MainCard> :
                                                <Grid container spacing={2} alignItems="center" justifyContent="left">
                                                    <Grid item>
                                                        <span role="button" aria-hidden="true" style={{ textDecoration: 'underline' }} onClick={async (e) => {
                                                            e.preventDefault();
                                                            handleDownload(row.teamId, file.id, file.name, file.url_private);
                                                        }}>{file.name}</span>
                                                    </Grid>
                                                    {isDownloading[file.id] && (filenames.indexOf(file.id) > -1) &&
                                                        <Grid item xs>
                                                            <LinearProgress variant="determinate" color="secondary" value={downloadProgress[file.id] || 0} />
                                                        </Grid>
                                                    }
                                                    {isDownloading[file.id] && (filenames.indexOf(file.id) > -1) &&
                                                        <Grid item>
                                                            <Typography variant="h6">{Math.round(downloadProgress[file.id] || 0)}%</Typography>
                                                        </Grid>
                                                    }
                                                </Grid>
                                            )}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>{row.realname}</TableCell>
                                    <TableCell>
                                        <Box sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }} onClick={() => navigation(`/slack/team/${row.teamId}?name=${row.teamName}`)}>
                                            <FontAwesomeIcon icon={faSlack} style={{ width: 30, height: 30, color: '#3f0e40' }} />
                                            <Typography variant="body2" sx={{ ml: 1, color: '#2196f3' }}>
                                                {row.teamName}
                                            </Typography>
                                        </Box>
                                    </TableCell>
                                    <TableCell>{row.channel}</TableCell>
                                    <TableCell align="left">{row.created}</TableCell>
                                    <TableCell align="center" sx={{ cursor: 'pointer', color: 'primary' }}>
                                        {row.replies && row.replies.length > 0 ? <Typography variant="subtitle1" sx={{ color: '#2196f3', textDecoration: 'underline' }}>
                                            {`${row.replies.length}`}
                                        </Typography> : null}
                                    </TableCell>
                                    <TableCell align="left">
                                        {row.reactions && row.reactions.map((r, idx) =>
                                            <span style={{ marginRight: '8px' }} key={idx}>
                                                <OutlinedBadge badgeContent={r.count}>
                                                    <img src={`https://a.slack-edge.com/production-standard-emoji-assets/14.0/google-medium/${emojis[r.name]}.png`} alt={`${r.name}`} />
                                                </OutlinedBadge>
                                            </span>
                                        )}
                                    </TableCell>
                                </TableRow>
                            );
                        })}

                        {selectedType === 'outlook' && rows.map((row, index) => {
                            const isItemSelected = isSelected(row.index);
                            const labelId = `enhanced-table-checkbox-${index}`;

                            return (
                                <TableRow
                                    hover
                                    role="checkbox"
                                    aria-checked={isItemSelected}
                                    tabIndex={-1}
                                    key={index}
                                    selected={isItemSelected}
                                >
                                    <TableCell padding="checkbox" sx={{ pl: 3 }} onClick={(event) => handleClick(event, row.index)}>
                                        <Checkbox
                                            color="primary"
                                            checked={isItemSelected}
                                            inputProps={{ 'aria-labelledby': labelId }}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Tooltip title={row.subject}>
                                            <Typography noWrap>{truncateText(row.subject, 30)}</Typography>
                                        </Tooltip>
                                    </TableCell>
                                    <TableCell>{row.sender}</TableCell>
                                    <TableCell>
                                        <Tooltip title={row.toRecipients?.map(recipient => recipient.emailAddress.name).join(', ')}>
                                            <Typography noWrap>{truncateText(row.toRecipients?.map(recipient => recipient.emailAddress.name).join(', '), 20)}</Typography>
                                        </Tooltip>
                                    </TableCell>
                                    <TableCell>{new Date(row.createdDateTime).toLocaleString()}</TableCell>
                                    <TableCell>{new Date(row.receivedDateTime).toLocaleString()}</TableCell>
                                    <TableCell>{new Date(row.sentDateTime).toLocaleString()}</TableCell>
                                    <TableCell>
                                        <Tooltip title={row.bodyPreview}>
                                            <Typography noWrap>{truncateText(row.bodyPreview, 30)}</Typography>
                                        </Tooltip>
                                    </TableCell>
                                    <TableCell>{row.folderPath || ''}</TableCell>
                                    {/* Render Attachments */}
                                    <TableCell>
                                        {row.hasAttachments && row.attachments && row.attachments.length > 0 && row.attachments.map((attachment, idx) => (
                                            <Grid container key={idx} spacing={2} alignItems="center" justifyContent="left">
                                                <Grid item>
                                                    <span role="button" style={{ textDecoration: 'underline', cursor: 'pointer' }} onClick={() => handleOutlookAttachmentDownload(row.archiveId, attachment)}>
                                                        {attachment.name} ({(attachment.size / 1024).toFixed(2)} KB)
                                                    </span>
                                                </Grid>
                                                {isDownloading[attachment.id] && (
                                                    <Grid item xs>
                                                        <LinearProgress variant="determinate" value={downloadProgress[attachment.id] || 0} />
                                                    </Grid>
                                                )}
                                                {isDownloading[attachment.id] && (
                                                    <Grid item>
                                                        <Typography variant="h6">{Math.round(downloadProgress[attachment.id] || 0)}%</Typography>
                                                    </Grid>
                                                )}
                                            </Grid>
                                        ))}
                                    </TableCell>
                                    <TableCell align='center'>
                                        {row.downloadLogs.length > 0 ? (
                                            <span
                                                role="button"
                                                tabIndex="0"
                                                style={{ color: 'blue', textDecoration: 'underline', cursor: 'pointer' }}
                                                onClick={() => handleOpenLogDialog(row.downloadLogs)}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter' || e.key === ' ') {
                                                        handleOpenLogDialog(row.downloadLogs);
                                                    }
                                                }}
                                            >
                                                {row.downloadLogs.length}
                                            </span>
                                        ) : (
                                            row.downloadLogs.length
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <Box display="flex" justifyContent="center" alignItems="center">
                                            {/* <IconButton color="primary" onClick={() => handleOutlookDownload(row.archiveId, row.id, `${row.subject}.msg`)}>
                                                <DownloadIcon />
                                            </IconButton> */}
                                            {renderDownloadButton(row.id, handleOutlookDownload, [row.archiveId, row.id, `${row.subject?.replace(/[^a-z0-9]/gi, '_').toLowerCase() || 'no_subject'}.zip`], isDownloading, downloadProgress)}
                                            <IconButton onClick={() => handleOpenDialog(row.archiveId, row.id, row)}>
                                                <VisibilityIcon />
                                            </IconButton>
                                        </Box>
                                    </TableCell>
                                    <TableCell>{row.workspaceName}</TableCell>
                                    <TableCell>{row.archiveName}</TableCell>
                                    <TableCell>{row.archiveId}</TableCell>
                                </TableRow>
                            );
                        })}

                        {selectedType === 'onedrive' && rows.map((row, index) => {
                            const isItemSelected = isSelected(row.index);
                            const labelId = `enhanced-table-checkbox-${index}`;

                            return (
                                <TableRow
                                    hover
                                    role="checkbox"
                                    aria-checked={isItemSelected}
                                    tabIndex={-1}
                                    key={index}
                                    selected={isItemSelected}
                                >
                                    <TableCell padding="checkbox" sx={{ pl: 3 }} onClick={(event) => handleClick(event, row.index)}>
                                        <Checkbox
                                            color="primary"
                                            checked={isItemSelected}
                                            inputProps={{ 'aria-labelledby': labelId }}
                                        />
                                    </TableCell>
                                    <TableCell>{row.name}</TableCell>
                                    <TableCell>{row.createdBy}</TableCell>
                                    <TableCell>{new Date(row.createdDateTime).toLocaleString()}</TableCell>
                                    <TableCell>{row.lastModifiedBy}</TableCell>
                                    <TableCell>{new Date(row.lastModifiedDateTime).toLocaleString()}</TableCell>
                                    <TableCell align="center">{row.size}</TableCell>
                                    <TableCell>{row.workspaceName}</TableCell>
                                    <TableCell>{row.archiveName}</TableCell>
                                    <TableCell>{row.archiveId}</TableCell>
                                    <TableCell>
                                        <Box display="flex" justifyContent="center" alignItems="center">
                                            {/* <IconButton color="primary" onClick={() => handleOneDriveDownload(row.archiveId, row.id, row.name)}>
                                                <DownloadIcon />
                                            </IconButton> */}
                                            {renderDownloadButton(`${row.archiveId}_${row.id}`, handleOneDriveDownload, [row.archiveId, `${row.archiveId}_${row.id}`, row.name], isDownloading, downloadProgress)}
                                        </Box>
                                    </TableCell>
                                </TableRow>
                            )
                        })}

                        {selectedType === 'gmail' && rows.map((row, index) => {
                            const isItemSelected = isSelected(row.index);
                            const labelId = `enhanced-table-checkbox-${index}`;

                            return (
                                <TableRow
                                    hover
                                    role="checkbox"
                                    aria-checked={isItemSelected}
                                    tabIndex={-1}
                                    key={index}
                                    selected={isItemSelected}
                                >
                                    <TableCell padding="checkbox" sx={{ pl: 3 }} onClick={(event) => handleClick(event, row.index)}>
                                        <Checkbox
                                            color="primary"
                                            checked={isItemSelected}
                                            inputProps={{ 'aria-labelledby': labelId }}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Tooltip title={row.subject}>
                                            <Typography noWrap>{truncateText(row.subject)}</Typography>
                                        </Tooltip>
                                    </TableCell>
                                    <TableCell>{row.from}</TableCell>
                                    <TableCell>
                                        <Tooltip title={row.to}>
                                            <Typography noWrap>{truncateText(row.to, 20)}</Typography>
                                        </Tooltip>
                                    </TableCell>
                                    <TableCell>{new Date(row.date).toLocaleString()}</TableCell>
                                    <TableCell>
                                        <Tooltip title={row.preview}>
                                            <Typography noWrap>{truncateText(row.preview)}</Typography>
                                        </Tooltip>
                                    </TableCell>
                                    {/* Render Attachments */}
                                    <TableCell>
                                        {row.attachments && row.attachments.length > 0 && row.attachments.map((attachment, idx) => (
                                            <Grid container key={idx} spacing={2} alignItems="center" justifyContent="left">
                                                <Grid item>
                                                    <span role="button" style={{ textDecoration: 'underline', cursor: 'pointer' }} onClick={() => handleGmailAttachmentDownload(row.archiveId, attachment)}>
                                                        {attachment.filename} ({formatSizeUnits(attachment.size)})
                                                    </span>
                                                </Grid>
                                                {isDownloading[attachment.attachmentId] && (
                                                    <Grid item xs>
                                                        <LinearProgress variant="determinate" value={downloadProgress[attachment.attachmentId] || 0} />
                                                    </Grid>
                                                )}
                                                {isDownloading[attachment.attachmentId] && (
                                                    <Grid item>
                                                        <Typography variant="h6">{Math.round(downloadProgress[attachment.attachmentId] || 0)}%</Typography>
                                                    </Grid>
                                                )}
                                            </Grid>
                                        ))}
                                    </TableCell>
                                    <TableCell>
                                        <Box display="flex" justifyContent="flex-start" alignItems="left">
                                            {/* <IconButton color="primary" onClick={() => handleGmailDownload(row.archiveId, row.id, `${row.subject}.eml`)}>
                                                <DownloadIcon />
                                            </IconButton> */}
                                            {renderDownloadButton(row.id, handleGmailDownload, [row.archiveId, row.id, `${row.subject}.eml`], isDownloading, downloadProgress)}
                                            <IconButton onClick={() => handleOpenDialog(row.archiveId, row.id)}>
                                                <VisibilityIcon />
                                            </IconButton>
                                        </Box>
                                    </TableCell>
                                    <TableCell>{row.workspaceName}</TableCell>
                                    <TableCell>{row.archiveName}</TableCell>
                                    <TableCell>{row.archiveId}</TableCell>
                                </TableRow>
                            );
                        })}
                        {selectedType === 'googledrive' && rows.map((row, index) => {
                            const isItemSelected = isSelected(row.index);
                            const labelId = `enhanced-table-checkbox-${index}`;

                            return (
                                <TableRow
                                    hover
                                    role="checkbox"
                                    aria-checked={isItemSelected}
                                    tabIndex={-1}
                                    key={index}
                                    selected={isItemSelected}
                                >
                                    <TableCell padding="checkbox" sx={{ pl: 3 }} onClick={(event) => handleClick(event, row.index)}>
                                        <Checkbox
                                            color="primary"
                                            checked={isItemSelected}
                                            inputProps={{ 'aria-labelledby': labelId }}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        {row.thumbnailLink ? (
                                            <img src={row.thumbnailLink} alt="Thumbnail" style={{ width: 50, height: 50 }} />
                                        ) : null}
                                        {row.name}
                                    </TableCell>
                                    <TableCell>{new Date(row.createdTime).toLocaleString()}</TableCell>
                                    <TableCell>{new Date(row.modifiedTime).toLocaleString()}</TableCell>
                                    <TableCell align="center">{row.size}</TableCell>
                                    <TableCell>{row.md5Checksum}</TableCell> {/* Add this line */}
                                    <TableCell>{row.workspaceName}</TableCell>
                                    <TableCell>{row.archiveName}</TableCell>
                                    <TableCell>
                                        <Box display="flex" justifyContent="center" alignItems="center">
                                            {/* <IconButton color="primary" onClick={() => handleGoogleDriveDownload(row.archiveId, row.id, row.name)}>
                                                <DownloadIcon />
                                            </IconButton> */}
                                            {renderDownloadButton(`${row.archiveId}_${row.id}`, handleGoogleDriveDownload, [row.archiveId, `${row.archiveId}_${row.id}`, row.name], isDownloading, downloadProgress)}
                                        </Box>
                                    </TableCell>
                                </TableRow>
                            )
                        })}

                        {selectedType === 'dropbox' && rows.map((row, index) => {
                            const isItemSelected = isSelected(row.index);
                            const labelId = `enhanced-table-checkbox-${index}`;

                            return (
                                <TableRow
                                    hover
                                    role="checkbox"
                                    aria-checked={isItemSelected}
                                    tabIndex={-1}
                                    key={index}
                                    selected={isItemSelected}
                                >
                                    <TableCell padding="checkbox" sx={{ pl: 3 }} onClick={(event) => handleClick(event, row.index)}>
                                        <Checkbox
                                            color="primary"
                                            checked={isItemSelected}
                                            inputProps={{ 'aria-labelledby': labelId }}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        {row.name}
                                    </TableCell>
                                    <TableCell>{row.mimeType}</TableCell>
                                    <TableCell align="center">{formatSizeUnits(row.size)}</TableCell>
                                    <TableCell>
                                        <Tooltip title={row.path}>
                                            <Typography noWrap>{truncateText(row.path, 10)}</Typography>
                                        </Tooltip>
                                    </TableCell>
                                    <TableCell>
                                        <Tooltip title={row.md5Checksum}>
                                            <Typography noWrap>{truncateText(row.md5Checksum, 10)}</Typography>
                                        </Tooltip>
                                    </TableCell>
                                    <TableCell>{row.isDeleted?.toString()}</TableCell>
                                    <TableCell>{new Date(row.createdTime).toLocaleString()}</TableCell>
                                    <TableCell>{new Date(row.modifiedTime).toLocaleString()}</TableCell>
                                    <TableCell>{row.workspaceName}</TableCell>
                                    <TableCell>{row.archiveName}</TableCell>
                                    <TableCell>
                                        <Box display="flex" justifyContent="center" alignItems="center">
                                            {/* <IconButton color="primary" onClick={() => handleFilesDownload(s3Key, row.fileId, row.fileName)}>
                                                <DownloadIcon />
                                            </IconButton> */}
                                            {renderDownloadButton(`${row.archiveId}_${row.id}`, handleFilesDownload, [row.s3Key || `Dropbox/${row.archiveId}/${row.id}/${row.name}`, `${row.archiveId}_${row.id}`, row.name, row.size], isDownloading, downloadProgress)}
                                        </Box>
                                    </TableCell>
                                </TableRow>
                            )
                        })}

                        {selectedType === 'files' && rows.map((row, index) => {
                            const isItemSelected = isSelected(row.index);
                            const labelId = `enhanced-table-checkbox-${index}`;

                            return (
                                <TableRow
                                    hover
                                    role="checkbox"
                                    aria-checked={isItemSelected}
                                    tabIndex={-1}
                                    key={index}
                                    selected={isItemSelected}
                                >
                                    <TableCell padding="checkbox" sx={{ pl: 3 }} onClick={(event) => handleClick(event, row.index)}>
                                        <Checkbox
                                            color="primary"
                                            checked={isItemSelected}
                                            inputProps={{ 'aria-labelledby': labelId }}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        {row.fileName}
                                    </TableCell>
                                    <TableCell>{row.fileType}</TableCell>
                                    <TableCell align="center">{formatSizeUnits(row.size)}</TableCell>
                                    <TableCell align="center">{row.archiveId}</TableCell>
                                    <TableCell>{new Date(row.createdAt).toLocaleString()}</TableCell>
                                    <TableCell>{new Date(row.updatedAt).toLocaleString()}</TableCell>
                                    <TableCell>{row.owner}</TableCell>
                                    <TableCell>
                                        <Box display="flex" justifyContent="center" alignItems="center">
                                            {/* <IconButton color="primary" onClick={() => handleFilesDownload(s3Key, row.fileId, row.fileName)}>
                                                <DownloadIcon />
                                            </IconButton> */}
                                            {renderDownloadButton(`${row.archiveId}_${row.fileId}`, handleFilesDownload, [row.s3Key, `${row.archiveId}_${row.fileId}`, row.fileName, row.size], isDownloading, downloadProgress)}
                                        </Box>
                                    </TableCell>
                                </TableRow>
                            )
                        })}

                        {selectedType === 'flagged' && rows.map((row, index) => {
                            const isItemSelected = isSelected(row.index);
                            const labelId = `enhanced-table-checkbox-${index}`;

                            return (
                                <TableRow
                                    hover
                                    role="checkbox"
                                    aria-checked={isItemSelected}
                                    tabIndex={-1}
                                    key={index}
                                    selected={isItemSelected}
                                >
                                    <TableCell padding="checkbox" sx={{ pl: 3 }} onClick={(event) => handleClick(event, row.index)}>
                                        <Checkbox
                                            color="primary"
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
                                        <Tooltip title={row.preview}>
                                            <Typography noWrap>{truncateText(row.preview, 20)}</Typography>
                                        </Tooltip>
                                    </TableCell>
                                    <TableCell align="center">{row.date}</TableCell>
                                    <TableCell>{row.size}</TableCell>
                                    <TableCell>
                                        {
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
                                                        handleDownloadFlaggedAttachment(row, attachment);
                                                    }}
                                                    >
                                                    {truncateText(attachment.name || attachment.filename || attachment.title, 15)}
                                                    </Typography>
                                                ))}
                                            </Box>
                                        }
                                    </TableCell>
                                    <TableCell>
                                        <Box display="flex" justifyContent="center" alignItems="center">
                                            {renderDownloadButton(row.id, handleFlaggedDownload, [row], isDownloading, downloadProgress)}
                                            {(row.type === 'slack' || row.type === 'gmail' || row.type === 'outlook') && <IconButton onClick={() => handleOpenDialog(row.archiveId, row.id, row)}>
                                                <VisibilityIcon />
                                            </IconButton>}
                                        </Box>
                                    </TableCell>
                                    <TableCell>{row.archiveId}</TableCell>
                                    <TableCell>{row.workspaceName}</TableCell>
                                    <TableCell>{row.archiveName}</TableCell>
                                </TableRow>
                            );
                        })}

                    </TableBody>
                </Table>
            </TableContainer>

            <TablePagination
                rowsPerPageOptions={[5, 10, 25]}
                component="div"
                count={getRowCount()}
                rowsPerPage={getRowsPerPage()}
                page={getPage()}
                onPageChange={handlePageChange}
                onRowsPerPageChange={handleRowsPerPageChange}
            />
            <ModalGateway>
                {modal ? (
                    <Modal onClose={() => { setModal(!modal); setImages([]); }}>
                        {images.length > 0 ? <Carousel views={images} /> : <CircularProgress />}
                    </Modal>
                ) : null}
            </ModalGateway>
            <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
                <DialogTitle>Email Content</DialogTitle>
                <DialogContent>
                    {loading ? <CircularProgress /> : <Typography><div dangerouslySetInnerHTML={{ __html: emailContent }} /></Typography>}
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDialog} color="primary">
                        Close
                    </Button>
                </DialogActions>
            </Dialog>
            <Dialog open={logDialogOpen} onClose={handleCloseLogDialog} maxWidth="md" fullWidth>
                <DialogTitle>Download Logs</DialogTitle>
                <DialogContent>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>Email</TableCell>
                                <TableCell>Name</TableCell>
                                <TableCell>Hash</TableCell>
                                <TableCell>Downloaded At</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {downloadLogs.map((log, index) => (
                                <TableRow key={index}>
                                    <TableCell>{log.userEmail}</TableCell>
                                    <TableCell>{log.userName}</TableCell>
                                    <TableCell>{log.hash}</TableCell>
                                    <TableCell>{log.downloadedAt}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseLogDialog} color="primary">
                        Close
                    </Button>
                </DialogActions>
            </Dialog>
        </MainCard>
    );
};

export default SearchResult;
