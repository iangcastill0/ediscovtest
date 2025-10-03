import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { Box } from '@mui/material';
import { TreeTable } from 'primereact/treetable';
import { Column } from 'primereact/column';
import axios from 'utils/axios';
import { ProgressBar } from 'primereact/progressbar';
import MainCard from 'ui-component/cards/MainCard';
import "primereact/resources/themes/lara-light-cyan/theme.css";
import IconButton from '@mui/material/IconButton';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import { Tooltip, Dialog, DialogTitle, DialogContent, DialogActions, Button, Table, TableBody, TableCell, TableHead, TableRow } from '@mui/material';
import SearchBox from 'ui-component/extended/SearchBox';
import SimpleSearchDialog from 'ui-component/extended/SimpleSearchDialog';
import useDownload from 'hooks/useDownload';
import Flag from 'ui-component/extended/Flag';
import { getStoredCollectionMap } from 'utils/apiHelper';
import './Files.css';

const formatSizeUnits = (bytes) => {
    if (bytes === 0 || bytes === 'N/A') return 'N/A';
    if (typeof bytes === 'string') bytes = parseInt(bytes);
    if (isNaN(bytes)) return 'N/A';
    
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    if (bytes === 0) return '0 Byte';
    const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
    return Math.round(bytes / Math.pow(1024, i), 2) + ' ' + sizes[i];
};

const calculateFolderSize = (node) => {
    if (!node.children || node.children.length === 0) {
        return node.data.size !== 'N/A' ? parseInt(node.data.size, 10) : 0;
    }
    return node.children.reduce((total, child) => total + calculateFolderSize(child), 0);
};

const Files = ({ workspaceId, userId, isPersonal }) => {
    const [loading, setLoading] = useState(true);
    const [nodes, setNodes] = useState([]);
    const [originalNodes, setOriginalNodes] = useState([]);
    const [currentSearch, setCurrentSearch] = useState({});
    const [dialogOpen, setDialogOpen] = useState(false);
    const [versionHistoryData, setVersionHistoryData] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const treeTableRef = useRef(null);
    const [flagCollections, setFlagCollections] = React.useState([])
    const [storedCollectionMap, setStoredCollectionMap] = React.useState({})
    const { startDownload } = useDownload();

    useEffect(() => {
        const fetchDropboxData = async () => {
            setLoading(true);
            try {
                const rep = await axios.get('/flagged-collections/collectionList')
                const storedCollectionsMap = await getStoredCollectionMap('dropbox')
                const flaggedCollections = rep.data?.data || []
                setFlagCollections(flaggedCollections)
                setStoredCollectionMap(storedCollectionsMap)
                const response = await axios.get(
                    `/dropbox/workspace/${workspaceId}/members/${userId}/files?isPersonal=${isPersonal}`
                );
                setNodes(response.data?.data || []);
                setOriginalNodes(response.data?.data || []);
            } catch (error) {
                console.error('Error fetching Dropbox data:', error);
                setNodes([]);
                setOriginalNodes([]);
            } finally {
                setLoading(false);
            }
        };

        fetchDropboxData();
    }, [userId, workspaceId, isPersonal]);

    useEffect(() => {
        if (originalNodes.length > 0) {
            applyFilters();
        }
    }, [currentSearch, originalNodes]);

    const applyFilters = () => {
        if (!currentSearch.keywords && 
            !currentSearch.fileTypePattern && 
            !currentSearch.sizeRange && 
            !currentSearch.dateRange?.start && 
            !currentSearch.dateRange?.end) {
            setNodes(originalNodes);
            return;
        }

        const filteredNodes = filterNodes(originalNodes);
        console.log("filtered nodes: ", filterNodes)
        setNodes(filteredNodes);
    };

    const filterNodes = (nodes) => {
        const { keywords = '', fileTypePattern = '', sizeRange, dateRange } = currentSearch;
        const keywordLower = keywords.toLowerCase();
        const fileTypeRegex = getFileTypeRegex(fileTypePattern);
        const sizeFilter = sizeRange ? getSizeFilter(sizeRange) : null;
    
        const filterNode = (node) => {
            const matchesKeyword = !keywords || 
                node.data.label.toLowerCase().includes(keywordLower) || 
                node.data.type.toLowerCase().includes(keywordLower);
    
            const matchesFileType = !fileTypeRegex || 
                node.data.type.toLowerCase() === 'folder' ||
                fileTypeRegex.test(node.data.label);
    
            const matchesSize = !sizeFilter || 
                node.data.size === 'N/A' || 
                (sizeFilter.min <= Number(node.data.size) && (Number(node.data.size) < sizeFilter.max));
            
            const matchesDate = (!dateRange?.start && !dateRange?.end) || 
                (node.data.modifiedTime && isDateInRange(node.data.modifiedTime, dateRange.start, dateRange.end));
    
            return matchesKeyword && matchesFileType && matchesSize && matchesDate;
        };
    
        const filterTree = (nodes) => {
            return nodes
                .map(node => {
                    const filteredChildren = node.children ? filterTree(node.children) : [];
                    
                    if (node.data.type.toLowerCase() === 'folder') {
                        const hasMatchingChildren = filteredChildren.length > 0;
                        const nodeMatches = filterNode(node);
                        
                        if (nodeMatches || hasMatchingChildren) {
                            return {
                                ...node,
                                children: filteredChildren
                            };
                        }
                        return null;
                    }
                    
                    return filterNode(node) ? node : null;
                })
                .filter(node => node !== null);
        };
    
        return filterTree(nodes);
    };

    const isDateInRange = (dateString, startDate, endDate) => {
        if (!dateString || dateString === 'N/A') return false;
        
        try {
            const fileDate = new Date(dateString);
            const start = startDate ? new Date(startDate) : null;
            const end = endDate ? new Date(endDate) : null;

            if (start && fileDate < start) return false;
            if (end && fileDate > end) return false;
            
            return true;
        } catch {
            return false;
        }
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

    const getSizeFilter = (sizeRange) => {
        const sizeRanges = {
            '0-100': { min: 0, max: 100 * 1024 },
            '100-1024': { min: 100 * 1024, max: 1024 * 1024 },
            '1024-10240': { min: 1024 * 1024, max: 10240 * 1024 },
            '10240-102400': { min: 10240 * 1024, max: 102400 * 1024 },
            '102400-': { min: 102400 * 1024, max: Infinity }
        };
        return sizeRanges[sizeRange] || null;
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

    const handleVersionHistoryClick = (history) => {
        setVersionHistoryData(history);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
    };

    const flagBodyTemplate = (rowData) => {
        if (rowData.data.type === 'folder') return null;
        rowData.data.workspaceId = workspaceId;
        rowData.data.userId = userId;
        rowData.data.isPersonal = isPersonal
        return (
          <Flag 
            rowId={rowData.key} 
            type="dropbox" 
            rowData={rowData.data}
            collections={flagCollections}
            initialFlag={flagCollections.find((e) => e._id === storedCollectionMap[rowData.key])}
          />
        );
      };

    const versionHistoryTemplate = (rowData) => {
        const history = rowData.data.versionHistory || [];
        return history.length > 0 ? (
            <span
                style={{ color: '#1976d2', cursor: 'pointer', textDecoration: 'underline' }}
                onClick={() => handleVersionHistoryClick(history)}
            >
                {history.length}
            </span>
        ) : null;
    };

    const handleDownload = async (rowData) => {
        const fileId = rowData.key;
        const fileName = rowData.data.label;
        try {
            startDownload({
                type: 'Dropbox', 
                isArchive: false, 
                name: fileName, 
                id: Date.now(), 
                url: `/dropbox/workspace/${workspaceId}/members/${userId}/files/${fileId}/download?isPersonal=${isPersonal}&filePath=${rowData.data.path}`, 
                size: rowData.data.size, 
                responseType: 'blob'
            });
        } catch (error) {
            console.error('Download failed:', error);
        }
    };

    const truncatedBodyTemplate = (rowData, field) => {
        return (
            <Tooltip title={rowData.data[field]} placement="top">
                <span className="truncate">{rowData.data[field]}</span>
            </Tooltip>
        );
    };

    const sizeFilterFunction = (value, filter) => {
        if (!filter || filter.trim() === '') {
            return true;
        }
        const filterValue = parseFloat(filter) * 1024;
        return value && value !== 'N/A' && parseFloat(value) >= filterValue;
    };

    const dateFilterFunction = (value, filter) => {
        if (!filter || !value || value === 'N/A') return true;
        try {
            const fileDate = new Date(value);
            const filterDate = new Date(filter);
            return fileDate >= filterDate;
        } catch {
            return false;
        }
    };

    const actionTemplate = (rowData) => {
        return (
            <IconButton
                color="primary"
                onClick={() => handleDownload(rowData)}
                sx={{ display: `${rowData.data.type === 'Folder' ? 'none' : 'block'}` }}
            >
                <FileDownloadIcon />
            </IconButton>
        );
    };

    return (
        <MainCard content={false}>
            {loading ? (
                <Box display="flex" justifyContent="center" alignItems="center" height="200px">
                    <ProgressBar mode="indeterminate" style={{ width: '50%' }} />
                </Box>
            ) : (
                <>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                        <SearchBox 
                            handleSearch={handleKeywordsChange}
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
                    
                    {nodes.length > 0 ? (
                        <TreeTable 
                            ref={treeTableRef}
                            value={nodes} 
                            tableStyle={{ minWidth: '50rem' }}
                            filterDisplay="menu"
                        >
                             <Column 
                                body={flagBodyTemplate}
                                header="Flag"
                                style={{ width: '40px' }}
                            />
                            <Column 
                                field="label" 
                                header="Name" 
                                expander 
                                filterPlaceholder="Filter by name"
                            />
                            <Column
                                field="size"
                                header="Size"
                                filterPlaceholder="Filter by size (min KB)"
                                filterFunction={sizeFilterFunction}
                                body={(rowData) => `${rowData.data.formattedSize}`}
                            />
                            <Column 
                                field="type" 
                                header="Type" 
                                filterPlaceholder="Filter by type" 
                                body={(rowData) => truncatedBodyTemplate(rowData, 'type')}
                            />
                            <Column 
                                field="createdTime" 
                                header="Created Time" 
                                filterPlaceholder="Filter by created time" 
                                body={(rowData) => truncatedBodyTemplate(rowData, 'createdTime')}
                                filterFunction={dateFilterFunction}
                            />
                            <Column 
                                field="modifiedTime" 
                                header="Modified Time" 
                                filterPlaceholder="Filter by modified time" 
                                body={(rowData) => truncatedBodyTemplate(rowData, 'modifiedTime')}
                                filterFunction={dateFilterFunction}
                            />
                            <Column 
                                field="md5Checksum" 
                                header="MD5 Checksum" 
                                body={(rowData) => truncatedBodyTemplate(rowData, 'md5Checksum')}
                            />
                            <Column 
                                field="versionHistory" 
                                header="Version History" 
                                body={versionHistoryTemplate}
                            />
                            <Column body={actionTemplate} header="Actions" />
                        </TreeTable>
                    ) : (
                        <Box display="flex" justifyContent="center" alignItems="center" height="200px">
                            {originalNodes.length === 0 ? (
                                <span>No files found</span>
                            ) : (
                                <span>No files match your search criteria</span>
                            )}
                        </Box>
                    )}

                    <Dialog open={isModalOpen} onClose={closeModal}>
                        <DialogTitle>Version History</DialogTitle>
                        <DialogContent>
                            <Table>
                                <TableHead>
                                    <TableRow>
                                        <TableCell>ID</TableCell>
                                        <TableCell>Modified Time</TableCell>
                                        <TableCell>Size</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {versionHistoryData.map((version, index) => (
                                        <TableRow key={index}>
                                            <TableCell>{version.id}</TableCell>
                                            <TableCell>{version.modifiedTime}</TableCell>
                                            <TableCell>{formatSizeUnits(version.size)}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </DialogContent>
                        <DialogActions>
                            <Button onClick={closeModal} color="primary">Close</Button>
                        </DialogActions>
                    </Dialog>
                </>
            )}
        </MainCard>
    );
};

Files.propTypes = {
    workspaceId: PropTypes.string.isRequired,
    userId: PropTypes.string.isRequired,
    isPersonal: PropTypes.string.isRequired
};

export default Files;