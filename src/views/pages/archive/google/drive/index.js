import React, {useState} from 'react';
import {
    Button,
    Dialog,
    DialogContent,
    DialogTitle,
    TextField,
    Box,
    LinearProgress,
    CircularProgress,
    DialogActions
} from '@mui/material';
import { getDriveArchive, exportToFolderZipMultiple } from 'utils/apiHelper';
import { useParams, useNavigate } from 'react-router-dom';
import MainCard from 'ui-component/cards/MainCard';
import Tree from '@naisutech/react-tree'
import { SERVER_BASE_URL } from 'utils/axios';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import PropTypes from 'prop-types';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

const AdvancedSearchDialog = ({ open, onClose, onSubmit }) => {
    const [loading, setLoading] = useState(false);
    const [value, setValue] = useState('');
    const [dateRange, setDateRange] = useState({ start: null, end: null });
    const [emailFilters, setEmailFilters] = useState({ from: '', to: '' });

    const handleSubmit = () => {
        onSubmit({ keywords: value, dateRange, emailFilters });
        onClose();
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle>Advanced Search</DialogTitle>
            <DialogContent>
                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
                        <CircularProgress />
                    </Box>
                ) : (
                    <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <TextField
                            label="Keywords"
                            value={value}
                            onChange={(e) => setValue(e.target.value)}
                            fullWidth
                        />
                        <Box sx={{ display: 'flex', gap: 2 }}>
                            <DatePicker
                                label="Start Date"
                                value={dateRange.start}
                                onChange={(date) =>
                                    setDateRange((prev) => ({ 
                                        ...prev, 
                                        start: date
                                    }))
                                }
                                renderInput={(params) => <TextField {...params} fullWidth />}
                            />
                            <DatePicker
                                label="End Date"
                                value={dateRange.end}
                                onChange={(date) =>
                                    setDateRange((prev) => ({ 
                                        ...prev, 
                                        end: date
                                    }))
                                }
                                renderInput={(params) => <TextField {...params} fullWidth />}
                            />
                        </Box>
                        <Box sx={{ display: 'flex', gap: 2 }}>
                            <TextField
                                label="From (Email)"
                                value={emailFilters.from}
                                onChange={(e) =>
                                    setEmailFilters((prev) => ({ ...prev, from: e.target.value }))
                                }
                                fullWidth
                            />
                            <TextField
                                label="To (Email)"
                                value={emailFilters.to}
                                onChange={(e) =>
                                    setEmailFilters((prev) => ({ ...prev, to: e.target.value }))
                                }
                                fullWidth
                            />
                        </Box>
                    </Box>
                )}
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} color="secondary">
                    Cancel
                </Button>
                <Button onClick={handleSubmit} variant="contained" color="primary">
                    Submit
                </Button>
            </DialogActions>
        </Dialog>
    );
};

AdvancedSearchDialog.propTypes = {
    open: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    onSubmit: PropTypes.func.isRequired,
};

const FilesTable = () => {
    const [open, setOpen] = React.useState(false);
    const [selectedEmail, setSelectedEmail] = React.useState(null);
    const [searchQuery, setSearchQuery] = React.useState('');
    const [files, setFiles] = React.useState([]);
    const [userId, setUserId] = React.useState('');
    const [rows, setRows] = React.useState([]);
    const [page, setPage] = React.useState(0);
    const [loading, setLoading] = React.useState(false);
    const [rowsPerPage, setRowsPerPage] = React.useState(10);
    const { backupId } = useParams();
    const [isHistoryView, setIsHistoryView] = React.useState(false);
    const [flatList, setFlatList] = React.useState([]);
    const [nodeOfIds, setNodeOfIds] = React.useState({});
    const [nodeArray, setNodeArray] = React.useState([]);
    const [dialogOpen, setDialogOpen] = useState(false);
    const navigate = useNavigate();

    function childTree(children, parentId) {
        const childList = [];
        function processNode(node, parentId) {
            const transformedItem = {
                id: node.id,
                parentId,
                label: node.name,
                name: node.name,
                path: node.path,
                isFolder: node.isFolder
            };
            if (!node.isFolder) {
                childList.push(transformedItem);
            }
        }
        children.forEach(node => processNode(node, parentId));
        return childList;
    }
    function flattenTree(tree) {
      const flatList = [];
      const nodeOfIds = {};
      const nodeArray = [];
      function processNode(node, parentId = null) {
        const transformedItem = {
            id: node.id,
            parentId,
            label: node.name,
            name: node.name,
            path: node.path,
            baseId:node.baseId,
            isFolder: node.isFolder
        };
        if (node.isFolder && node.children) {
            transformedItem.items = childTree(node.children, node.id);
        }
        nodeOfIds[node.id] = transformedItem;
        nodeArray.push(transformedItem);
        if (node.isFolder || (!node.isFolder && parentId == null)) {
            flatList.push(transformedItem);
        }
        if (node.children && node.children.length > 0) {
            node.children.forEach(child => processNode(child, node.id));
        }
      }
      const rootItem = [{
        id: 'root',
        parentId: null,
        label: 'root',
        name: 'root',
        path: '/',
        isFolder: true,
        children: tree
      }];
      rootItem.forEach(node => processNode(node));
      return { flatList, nodeOfIds, nodeArray };
    }
    const onSelect = (node) => {
        const selectedNode = nodeOfIds[node[0]];
        if (selectedNode && !selectedNode.isFolder) {
            const url = `${SERVER_BASE_URL}/download/googleDrive/${selectedNode.baseId}/${selectedNode.id}/${selectedNode.name}`;
            window.open(url, '_blank');
        }
    };
    const handleExport = async () => {
        const treeFiles = [];
        setLoading(true);
        for (let i = 0; i < nodeArray.length; i += 1) {
            const selectedNode = nodeArray[i];
            if (selectedNode && !selectedNode.isFolder) {
                const url = `${SERVER_BASE_URL}/download/googleDrive/${selectedNode.baseId}/${selectedNode.id}/${selectedNode.name}`;
                const name = selectedNode.name;
                const folder = `root${selectedNode.path}`;
                treeFiles.push({url, name, folder});
            }
        }
        if(treeFiles.length > 0)
            await exportToFolderZipMultiple(treeFiles);
        setLoading(false);
    }
    React.useEffect(() => {
        const fetch = async () => {
            setLoading(true);
            const data = await getDriveArchive(backupId);
            console.log(data);
            setFiles(data?.backups);
            setRows(data?.backups);
            setUserId(data?.filters.userEmail);
            const treeDataList = flattenTree(data?.backups);
            setFlatList(treeDataList.flatList);
            setNodeOfIds(treeDataList.nodeOfIds);
            setNodeArray(treeDataList.nodeArray);
            setLoading(false);
        }
        fetch();
    }, [backupId]);

    const handleChangePage = (event, newPage) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    const handleRowClick = (email) => {
        setSelectedEmail(email);
        setOpen(true);
    };

    const handleClose = () => {
        setOpen(false);
    };

    const handleAdvancedSearchSubmit = (data) => {
        console.log('GoogleDrive Advanced Search Data:', data);
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
        parameterText += `&type=googledrive`;
        navigate(`/search?${parameterText}`, { replace: true, state: { forceRefresh: true } });
    };

    const query = new URLSearchParams(window.location.search);
    const title = query.get('name');

    return (
        <MainCard title={`${title}`} backButton>
            <Button variant="contained" color='primary' startIcon={<FileDownloadIcon />} style={{ float: 'right', marginBottom: 5 }} onClick={handleExport} sx={{ mr: 2 }}>
                Export to ZIP
            </Button>
            <Button
                variant="contained"
                onClick={() => setDialogOpen(true)}
                style={{ margin: 8, float: 'right' }}
            >
                {'Advanced\nSearch'}
            </Button>
            {loading && <LinearProgress />}
            <Tree nodes={flatList} animations onSelect={onSelect} />
            <LocalizationProvider dateAdapter={AdapterDateFns}>
                <AdvancedSearchDialog
                    open={dialogOpen}
                    onClose={() => setDialogOpen(false)}
                    onSubmit={handleAdvancedSearchSubmit}
                />
            </LocalizationProvider>
        </MainCard>
    );
};

export default FilesTable;
