import React, {useState, useEffect} from 'react';
import {
    Box,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Button,
    Typography,
    Link,
    LinearProgress,
    TextField
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { getOneDriveArchive, downloadArchiveOnedrive, exportToFolderZipMultiple } from 'utils/apiHelper';
import { useParams, useNavigate } from 'react-router-dom';
import MainCard from 'ui-component/cards/MainCard';
import Tree from '@naisutech/react-tree';
import { SERVER_BASE_URL } from 'utils/axios';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import FolderIcon from '@mui/icons-material/Folder';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import ImageIcon from '@mui/icons-material/Image';
import CloseOutlinedIcon from '@mui/icons-material/CloseOutlined';
import { formatSizeUnits } from 'utils/utils';
import useDownload from 'hooks/useDownload';
import SimpleSearchDialog from 'ui-component/extended/SimpleSearchDialog';

const FilesTable = () => {
    const theme = useTheme();
    const [searchQuery, setSearchQuery] = React.useState('');
    const [files, setFiles] = React.useState([]);
    const [userId, setUserId] = React.useState('');
    const [rows, setRows] = React.useState([]);
    const [loadingData, setLoadingData] = React.useState(false);
    const [loadingSearch, setLoadingSearch] = React.useState(false);
    const [loadingDownload, setLoadingDownload] = React.useState({});
    const [downloadProgress, setDownloadProgress] = React.useState({});
    const { backupId } = useParams();
    const [flatList, setFlatList] = React.useState([]);
    const [nodeOfIds, setNodeOfIds] = React.useState({});
    const [nodeArray, setNodeArray] = React.useState([]);
    const [filteredNodes, setFilteredNodes] = React.useState([]);
    const [isSelected, setIsSelected] = React.useState(false);
    const [versions, setVersions] = React.useState([]);
    const { startDownload } = useDownload()
    const [dialogOpen, setDialogOpen] = useState(false);
    const navigate = useNavigate();

    const flattenTree = (tree) => {
        const flatList = [];
        const nodeOfIds = {};
        const nodeArray = [];

        const processNode = (node, parentId = null) => {
            if (!node) return;

            const transformedItem = {
                id: node.id,
                parentId,
                label: node.name,
                name: node.name,
                size: node.size,
                path: node.path,
                baseId: node.baseId,
                isFolder: node.isFolder,
                children: node.children || undefined,
                versions: node.versions
            };

            if (!nodeOfIds[node.id]) {
                nodeOfIds[node.id] = transformedItem;
                nodeArray.push(transformedItem);
                flatList.push(transformedItem);
            }

            if (node.children) {
                node.children.forEach(child => processNode(child, node.id));
            }
        };

        // Add root node
        const rootNode = {
            id: 'root',
            parentId: null,
            label: 'root',
            name: 'root',
            path: '/',
            size: 0,
            isFolder: true,
            children: tree
        };

        processNode(rootNode);
        tree.forEach(node => processNode(node, 'root'));

        return { flatList, nodeOfIds, nodeArray };
    };

    const getFileIcon = (name) => {
        const extension = name.split('.').pop().toLowerCase();
        switch (extension) {
            case 'pdf':
                return <PictureAsPdfIcon />;
            case 'jpg':
            case 'jpeg':
            case 'png':
            case 'docx':
                return <InsertDriveFileIcon />;
            case 'gif':
                return <ImageIcon />;
            default:
                return <InsertDriveFileIcon />;
        }
    };

    const customNodeRenderer = (node) => {
        node = node?.data;
        return <Box display="flex" alignItems="center">
            {node.isFolder ? <FolderIcon /> : getFileIcon(node.name)}
        </Box>;
    };

    const onSelect = async (node) => {
        const selectedNode = nodeOfIds[node[0]];
        if (selectedNode && !selectedNode.isFolder) {
            setIsSelected(true);
            setVersions(selectedNode.versions);
            console.log(selectedNode);
        } else {
            setIsSelected(false);
            setVersions([]);
        }
    };

    const handleDownload = async (e, backupId, s3Key, size, filename) => {
        e.stopPropagation();
        // const downloadId = `${backupId}-${s3Key}`;

        // setLoadingDownload((prev) => ({ ...prev, [downloadId]: true }));
        // setDownloadProgress((prev) => ({ ...prev, [downloadId]: 0 }));

        // await downloadArchiveOnedrive(backupId, s3Key, filename, (progressEvent) => {
        //     const current = progressEvent.loaded;
        //     setDownloadProgress((prev) => ({
        //         ...prev,
        //         [downloadId]: Math.round((current / size) * 100)
        //     }));
        // });

        // setLoadingDownload((prev) => ({ ...prev, [downloadId]: false }));
        startDownload({
            type: 'OnedriveArchive', 
            isArchive: true, 
            name: `${filename}.zip`, 
            id: Date.now(), 
            url: `/archive/s3/download_v2?s3Key=${s3Key}&filename=${filename}`, 
            size, 
            responseType: 'blob'
        })
    };

    const handleExport = async () => {
        const treeFiles = [];
        setLoadingDownload(true);
        for (let i = 0; i < nodeArray.length; i += 1) {
            const selectedNode = nodeArray[i];
            if (selectedNode && !selectedNode.isFolder) {
                const url = `${SERVER_BASE_URL}/download/${selectedNode.baseId}/${selectedNode.id}/${selectedNode.name}`;
                const name = selectedNode.name;
                const folder = `root${selectedNode.path}`;
                treeFiles.push({ url, name, folder });
            }
        }
        if (treeFiles.length > 0)
            await exportToFolderZipMultiple(treeFiles);
        setLoadingDownload(false);
    };

    React.useEffect(() => {
        const fetch = async () => {
            setLoadingData(true);
            const data = await getOneDriveArchive(backupId);
            setFiles(data?.backups);
            setRows(data?.backups);
            setUserId(data?.filters.userEmail);
            const treeDataList = flattenTree(data?.backups);
            setFlatList(treeDataList.flatList);
            setNodeOfIds(treeDataList.nodeOfIds);
            setNodeArray(treeDataList.nodeArray);
            setFilteredNodes(treeDataList.flatList);
            setLoadingData(false);
        };
        fetch();
    }, [backupId]);

    React.useEffect(() => {
        const search = () => {
            setLoadingSearch(true);
            const query = searchQuery.toLowerCase();
            const filtered = flatList.filter(node => node.name.toLowerCase().includes(query));
            const parentIds = new Set(filtered.map(node => node.parentId));

            const addParents = (node) => {
                if (node.parentId && !parentIds.has(node.parentId)) {
                    parentIds.add(node.parentId);
                    addParents(nodeOfIds[node.parentId]);
                }
            };

            filtered.forEach(node => addParents(node));

            const seen = new Set();
            const filteredWithParents = flatList.filter(node => {
                if (filtered.includes(node) || parentIds.has(node.id) || node.id === 'root') {
                    if (!seen.has(node.id)) {
                        seen.add(node.id);
                        return true;
                    }
                }
                return false;
            });

            setFilteredNodes(filteredWithParents);
            setLoadingSearch(false);
        };
        search();
    }, [searchQuery, flatList]);

    const handleSearch = (e) => {
        setSearchQuery(e.target.value);
    };

    const handleAdvancedSearchSubmit = (data) => {
        console.log('Onedrive Advanced Search Data:', data);
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
        parameterText += `&type=onedrive`;
        navigate(`/search?${parameterText}`, { replace: true, state: { forceRefresh: true } });
    };

    const query = new URLSearchParams(window.location.search);
    const title = query.get('name');

    return (
        <MainCard title={`${title}`} backButton>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <TextField
                    variant="outlined"
                    placeholder="Search..."
                    value={searchQuery}
                    onChange={handleSearch}
                    size="small"
                />
                {/* <Button
                    variant="contained"
                    color='primary'
                    startIcon={<FileDownloadIcon />}
                    onClick={handleExport}
                    sx={{ ml: 2 }}
                >
                    Export to ZIP
                </Button> */}
                <Button
                    variant="contained"
                    onClick={() => setDialogOpen(true)}
                    style={{ margin: 8, float: 'right' }}
                >
                    {'Advanced\nSearch'}
                </Button>
            </Box>
            {(loadingData || loadingSearch) && <LinearProgress />}
            <Tree
                nodes={filteredNodes}
                animations
                onSelect={onSelect}
                IconRenderer={customNodeRenderer}
            />
            {isSelected && (
                <>
                    <Button variant="contained" size="medium" startIcon={<CloseOutlinedIcon />} onClick={() => setIsSelected(false)} />
                    <TableContainer>
                        <Table sx={{ minWidth: 750 }} aria-labelledby="tableTitle">
                            <TableHead>
                                <TableRow>
                                    <TableCell>Version</TableCell>
                                    <TableCell>Size</TableCell>
                                    <TableCell>Modified Date Time</TableCell>
                                    <TableCell>Last Modified Email</TableCell>
                                    <TableCell>Last Modified Name</TableCell>
                                    <TableCell>Download</TableCell>
                                    <TableCell>Progress</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {versions.map((historyRow, historyIndex) => {
                                    if (typeof historyRow === 'number') return null;
                                    const downloadId = `${backupId}-${historyRow.s3Key}`;
                                    const progress = downloadProgress[downloadId] || 0;
                                    const isLoading = loadingDownload[downloadId] || false;

                                    return (
                                        <TableRow
                                            hover
                                            tabIndex={-1}
                                            key={historyIndex}
                                        >
                                            <TableCell component="th" scope="row">
                                                <Typography
                                                    variant="subtitle1"
                                                    sx={{ color: theme.palette.mode === 'dark' ? 'grey.600' : 'grey.900' }}
                                                >
                                                    {historyRow.id}
                                                </Typography>
                                            </TableCell>
                                            <TableCell>{formatSizeUnits(historyRow.size)}</TableCell>
                                            <TableCell>{historyRow.lastModifiedDateTime}</TableCell>
                                            <TableCell>{historyRow.lastModifiedBy?.user.email}</TableCell>
                                            <TableCell>{historyRow.lastModifiedBy?.user.displayName}</TableCell>
                                            <TableCell>
                                                <Link onClick={(e) => handleDownload(e, backupId, historyRow.s3Key, historyRow.size, historyRow.s3Key.split('/')[2] )}>
                                                    <FileDownloadIcon />
                                                </Link>
                                            </TableCell>
                                            <TableCell>
                                                {isLoading && (
                                                    <LinearProgress variant="determinate" value={progress} sx={{ height: 10 }} />
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </>
            )}
            <SimpleSearchDialog
                open={dialogOpen}
                onClose={() => setDialogOpen(false)}
                onSubmit={handleAdvancedSearchSubmit}
            />
        </MainCard>
    );
};

export default FilesTable;
