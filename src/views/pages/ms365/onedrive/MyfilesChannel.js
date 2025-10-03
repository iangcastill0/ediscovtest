import React from 'react';
import PropTypes from 'prop-types';
import { useTheme } from '@mui/material/styles';
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
    LinearProgress,
    Chip
} from '@mui/material';
import MainCard from 'ui-component/cards/MainCard';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import CloseOutlinedIcon from '@mui/icons-material/CloseOutlined';
import Tree from '@naisutech/react-tree';
import FolderIcon from '@mui/icons-material/Folder';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import ImageIcon from '@mui/icons-material/Image';
import DescriptionIcon from '@mui/icons-material/Description';
import { MSOnedriveContext } from 'contexts/MSOnedriveContext';
import SearchBox from 'ui-component/extended/SearchBox';
import SimpleSearchDialog from 'ui-component/extended/SimpleSearchDialog';
import useDownload from 'hooks/useDownload';
import axios from 'utils/axios';
import Flag from 'ui-component/extended/Flag'; // Import the Flag component
import { getStoredCollectionMap } from 'utils/apiHelper';

// Size ranges in KB
const SIZE_RANGES = {
    '0-100': { min: 0, max: 100 },
    '100-1024': { min: 100, max: 1024 },
    '1024-10240': { min: 1024, max: 10240 },
    '10240-102400': { min: 10240, max: 102400 },
    '102400-': { min: 102400, max: Infinity }
};

const getFileIcon = (name) => {
    const extension = name.split('.').pop().toLowerCase();
    switch (extension) {
        case 'pdf': return <PictureAsPdfIcon />;
        case 'jpg':
        case 'jpeg':
        case 'png':
        case 'gif': return <ImageIcon />;
        case 'doc':
        case 'docx': return <DescriptionIcon />;
        case 'xls':
        case 'xlsx': return <DescriptionIcon />;
        case 'ppt':
        case 'pptx': return <DescriptionIcon />;
        case 'txt': return <DescriptionIcon />;
        case 'csv': return <DescriptionIcon />;
        case 'zip': return <DescriptionIcon />;
        default: return <InsertDriveFileIcon />;
    }
};

const CustomTreeNodeRenderer = ({ node, flagCollections, storedCollectionMap, workspaceId, userId }) => {
    const isFolder = node?.data?.isFolder;
    const nodeData = node?.data;
    nodeData.workspaceId = workspaceId;
    nodeData.userId =  userId;

    return (
        <Box display="flex" alignItems="center">
            {isFolder ? <FolderIcon /> : <Flag
                    rowId={nodeData.id}
                    type="onedrive"
                    initialFlag={flagCollections.find((e) => e._id === storedCollectionMap[nodeData.id])}
                    collections={flagCollections}
                    rowData={nodeData}
                />}
        </Box>
    );
};


const MyfilesChannel = ({ msgList, workspaceId, userId }) => {
    const theme = useTheme();
    const [filteredNodes, setFilteredNodes] = React.useState([]);
    const [isHistoryView, setIsHistoryView] = React.useState(false);
    const [loading, setLoading] = React.useState(false);
    const { onedriveData, getItemHistory } = React.useContext(MSOnedriveContext);
    const { startDownload } = useDownload();
    
    const [currentSearch, setCurrentSearch] = React.useState({});
    const [dialogOpen, setDialogOpen] = React.useState(false);
    const [flagCollections, setFlagCollections] = React.useState([])
    const [storedCollectionMap, setStoredCollectionMap] = React.useState({})

    React.useEffect(() => {
        const init = async () => {
            const rep = await axios.get('/flagged-collections/collectionList')
            const storedCollectionsMap = await getStoredCollectionMap('onedrive')
            const flaggedCollections = rep.data?.data || []
            setFlagCollections(flaggedCollections)
            setStoredCollectionMap(storedCollectionsMap)
        }

        init()
    }, [])


    const getHistory = async (id, name) => {
        setLoading(true);
        await getItemHistory(workspaceId, userId, id, name);
        setLoading(false);
        setIsHistoryView(true);
    };

    const onSelect = (nodeIds) => {
        const selectedNodeId = nodeIds[0];
        const selectedNode = findNodeById(msgList, selectedNodeId);
        
        if (selectedNode && !selectedNode.isFolder) {
            getHistory(selectedNodeId, selectedNode.name);
        }
    };

    const findNodeById = (nodes, id) => {
        for (const node of nodes) {
            if (node.id === id) return node;
            if (node.items) {
                const found = findNodeById(node.items, id);
                if (found) return found;
            }
        }
        return null;
    };

    const getFileTypeRegex = (pattern) => {
        if (!pattern) return null;
        
        try {
            const extensions = pattern
                .replace(/\*/g, '')
                .replace(/\./g, '')
                .replace(/\s/g, '')
                .split(',')
                .filter(ext => ext.length > 0);
            
            if (extensions.length === 0) return null;
            
            const regexPattern = `\\.(${extensions.join('|')})$`;
            return new RegExp(regexPattern, 'i');
        } catch {
            return null;
        }
    };

    const flattenTree = React.useCallback((nodes, parentId = null) => {
        return nodes.reduce((acc, node) => {
            const flattenedNode = { ...node, parentId };
            return [
                ...acc,
                flattenedNode,
                ...(node.items ? flattenTree(node.items, node.id) : [])
            ];
        }, []);
    }, []);

    const filterNodes = React.useCallback(() => {
        setLoading(true);
        
        const { 
            keywords = '', 
            dateRange, 
            fileTypePattern,
            sizeRange 
        } = currentSearch;
        
        const fileTypeRegex = getFileTypeRegex(fileTypePattern);
        
        if (!keywords && !dateRange && !fileTypeRegex && !sizeRange) {
            setFilteredNodes(msgList);
            setLoading(false);
            return;
        }
        
        const query = keywords.toLowerCase();
        const flattenedNodes = flattenTree(msgList);
        const parentIds = new Set();
        const matchedNodeIds = new Set();
        
        const sizeFilter = sizeRange ? SIZE_RANGES[sizeRange] : null;
        
        flattenedNodes.forEach(node => {
            let matches = true;
            
            if (node.isFolder) {
                if (query && !node.name.toLowerCase().includes(query)) {
                    matches = false;
                }
                if (matches) {
                    matchedNodeIds.add(node.id);
                }
                return;
            }
            
            if (query && !node.name.toLowerCase().includes(query)) {
                matches = false;
            }
            
            if (matches && dateRange) {
                const nodeDate = new Date(node.lastModifiedDateTime);
                const startDate = dateRange.start ? new Date(dateRange.start) : null;
                const endDate = dateRange.end ? new Date(dateRange.end) : null;
                
                if (startDate && nodeDate < startDate) matches = false;
                if (endDate && nodeDate > endDate) matches = false;
            }
            
            console.log(fileTypeRegex)
            if (matches && fileTypeRegex) {
                if (!fileTypeRegex.test(node.name)) {
                    matches = false;
                }
            }
            console.log(sizeFilter, node)
            if (matches && sizeFilter && node.size) {
                const sizeInKB = node.size / 1024;
                if (sizeInKB < sizeFilter.min || sizeInKB >= sizeFilter.max) {
                    matches = false;
                }
            }
            
            if (matches) {
                matchedNodeIds.add(node.id);
                let currentId = node.parentId;
                while (currentId) {
                    parentIds.add(currentId);
                    const parent = flattenedNodes.find(n => n.id === currentId);
                    currentId = parent?.parentId;
                }
            }
        });
        
        const buildTree = (nodes) => {
            return nodes
                .filter(node => 
                    matchedNodeIds.has(node.id) || 
                    parentIds.has(node.id) || 
                    node.id === 'root'
                )
                .map(node => ({
                    ...node,
                    items: node.items ? buildTree(node.items) : []
                }));
        };
        
        const result = buildTree(msgList);
        setFilteredNodes(result);
        setLoading(false);
    }, [currentSearch, msgList, flattenTree]);

    React.useEffect(() => {
        if (msgList && msgList.length > 0) {
            setFilteredNodes(msgList);
        }
    }, [msgList]);

    React.useEffect(() => {
        if (msgList && msgList.length > 0) {
            filterNodes();
        }
    }, [currentSearch, msgList, filterNodes]);

    const handleSearch = (keywords) => {
        setCurrentSearch(prev => ({ ...prev, keywords }));
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
                    handleSearch={handleSearch}
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
                isFile={true}
            />
            
            <Tree
                nodes={filteredNodes.length > 0 ? filteredNodes : msgList}
                animations
                onSelect={onSelect}
                IconRenderer={(node) => (
                    <CustomTreeNodeRenderer 
                        node={node} 
                        flagCollections={flagCollections} 
                        storedCollectionMap={storedCollectionMap} 
                        workspaceId={workspaceId} 
                        userId={userId} 
                    />
                )}
                theme='light'
                customTheme={{
                    nodes: {
                        folder: {
                            bgColor: 'gold'
                        }
                    }
                }}
            />
            
            {isHistoryView && (
                <>
                    <Button 
                        variant="contained" 
                        size="medium" 
                        startIcon={<CloseOutlinedIcon />} 
                        onClick={() => setIsHistoryView(false)}
                        sx={{ mb: 2 }}
                    >
                        Back to Files
                    </Button>
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
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {onedriveData.versionHistory.map((historyRow, historyIndex) => {
                                    if (typeof historyRow === 'number') return null;
                                    return (
                                        <TableRow hover tabIndex={-1} key={historyIndex}>
                                            <TableCell>{historyRow.id}</TableCell>
                                            <TableCell>{historyRow.size}</TableCell>
                                            <TableCell>{historyRow.lastModifiedDateTime}</TableCell>
                                            <TableCell>{historyRow.lastModifiedBy?.user.email}</TableCell>
                                            <TableCell>{historyRow.lastModifiedBy?.user.displayName}</TableCell>
                                            <TableCell>
                                                <Button onClick={() => startDownload({
                                                    type: 'Onedrive', 
                                                    name: onedriveData.fileName, 
                                                    url: historyRow['@microsoft.graph.downloadUrl'], 
                                                    size: historyRow.size, 
                                                    responseType: 'blob'
                                                })}>
                                                    <FileDownloadIcon />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </>
            )}
        </MainCard>
    );
};

MyfilesChannel.propTypes = {
    msgList: PropTypes.array.isRequired,
    workspaceId: PropTypes.string.isRequired,
    userId: PropTypes.string.isRequired,
};

export default MyfilesChannel;