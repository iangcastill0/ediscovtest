import PropTypes from 'prop-types';
import React, { useState, useEffect, useRef } from 'react';
import { Box } from '@mui/material';
import { TreeTable } from 'primereact/treetable';
import { Column } from 'primereact/column';
import axios from 'utils/axios';
import { ProgressBar } from 'primereact/progressbar';
import MainCard from 'ui-component/cards/MainCard';
import "primereact/resources/themes/lara-light-cyan/theme.css";
import IconButton from '@mui/material/IconButton';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import { Tooltip } from '@mui/material';
import './MyFilesTreeTable.css';
import SearchBox from 'ui-component/extended/SearchBox';
import SimpleSearchDialog from 'ui-component/extended/SimpleSearchDialog';
import useDownload from 'hooks/useDownload';
import Flag from 'ui-component/extended/Flag';
import { getStoredCollectionMap } from 'utils/apiHelper';
import { getGoogleDriveEditorName } from 'utils/utils';

// Utility function to format file sizes
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

const flattenDriveData = (files) => {
    const tree = [];
    const map = {};

    // First pass: create all nodes
    files.forEach(file => {
        const isFolder = file.mimeType === 'application/vnd.google-apps.folder';
        map[file.id] = {
            key: file.id,
            label: file.name,
            data: {
                id: file.id,
                label: file.name,
                size: file.size || 'N/A',
                formattedSize: file.size ? formatSizeUnits(file.size) : 'N/A',
                type: isFolder ? 'Folder' : file.mimeType,
                createdTime: file.createdTime,
                modifiedTime: file.modifiedTime,
                md5Checksum: file.md5Checksum || 'N/A',
                thumbnailLink: file.thumbnailLink || null,
                extension: file.name.split('.').pop().toLowerCase()
            },
            icon: isFolder ? 'pi pi-fw pi-folder' : 'pi pi-fw pi-file',
            children: []
        };
    });

    // Second pass: build hierarchy
    files.forEach(file => {
        if (file.parents && file.parents.length > 0) {
            const parentId = file.parents[0];
            if (map[parentId]) {
                map[parentId].children.push(map[file.id]);
            } else {
                tree.push(map[file.id]);
            }
        } else {
            tree.push(map[file.id]);
        }
    });

    // Calculate folder sizes
    tree.forEach(rootNode => {
        if (rootNode.data.type === 'Folder') {
            rootNode.data.size = calculateFolderSize(rootNode);
            rootNode.data.formattedSize = formatSizeUnits(rootNode.data.size);
        }
    });

    return tree;
};

const MyFilesTreeTable = ({ workspaceId, userId, isPersonal }) => {
    const [loading, setLoading] = useState(true); // Start with loading true
    const [nodes, setNodes] = useState([]);
    const [originalNodes, setOriginalNodes] = useState([]);
    const [currentSearch, setCurrentSearch] = useState({});
    const [dialogOpen, setDialogOpen] = useState(false);
    const treeTableRef = useRef(null);
    const [flagCollections, setFlagCollections] = React.useState([])
    const [storedCollectionMap, setStoredCollectionMap] = React.useState({})
    const { startDownload } = useDownload();

    useEffect(() => {
        const fetchGoogleDriveData = async () => {
            try {
                const rep = await axios.get('/flagged-collections/collectionList')
                const storedCollectionsMap = await getStoredCollectionMap('googledrive')
                const flaggedCollections = rep.data?.data || []
                setFlagCollections(flaggedCollections)
                setStoredCollectionMap(storedCollectionsMap)

                const response = await axios.get(
                    `/google/workspace/${workspaceId}/users/${userId}/v2/drive?isPersonal=${isPersonal}`
                );
                const treeData = flattenDriveData(response.data);
                setNodes(treeData);
                setOriginalNodes(treeData);
            } catch (error) {
                console.error('Error fetching Google Drive data:', error);
                setNodes([]);
                setOriginalNodes([]);
            } finally {
                setLoading(false);
            }
        };

        fetchGoogleDriveData();
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
        setNodes(filteredNodes);
    };

    const filterNodes = (nodes) => {
        const { keywords = '', fileTypePattern = '', sizeRange, dateRange } = currentSearch;
        const keywordLower = keywords.toLowerCase();
        const fileTypeRegex = getFileTypeRegex(fileTypePattern);
        const sizeFilter = sizeRange ? getSizeFilter(sizeRange) : null;
    
        const filterNode = (node) => {
            // Check if node matches all filters
            const matchesKeyword = !keywords || 
                node.data.label.toLowerCase().includes(keywordLower) || 
                node.data.type.toLowerCase().includes(keywordLower);
    
            const matchesFileType = !fileTypeRegex || 
                node.data.type === 'Folder' || 
                fileTypeRegex.test(node.data.label);
    
            const matchesSize = !sizeFilter || 
                node.data.size === 'N/A' || 
                (sizeFilter.min <= node.data.size && node.data.size < sizeFilter.max);
            const matchesDate = (!dateRange?.start && !dateRange?.end) || 
                (node.data.modifiedTime && isDateInRange(node.data.modifiedTime, dateRange.start, dateRange.end));
    
            return matchesKeyword && matchesFileType && matchesSize && matchesDate;
        };
    
        const filterTree = (nodes) => {
            return nodes
                .map(node => {
                    // First filter the children
                    const filteredChildren = node.children ? filterTree(node.children) : [];
                    if (node.data.type === 'Folder') {
                        const nodeMatches = filterNode(node);
                        if (nodeMatches || filteredChildren.length > 0) {
                            return {
                                ...node,
                                children: filteredChildren
                            };
                        }
                        return null;
                    }
                    
                    // For files, only keep if they match filters
                    return filterNode(node) ? {
                        ...node,
                        children: filteredChildren
                    } : null;
                })
                .filter(node => node !== null);
        };
    
        return filterTree(nodes);
    };

    const isDateInRange = (dateString, startDate, endDate) => {
        if (!dateString) return false;
        
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

    const handleDownload = async (rowData) => {
        const fileId = rowData.key;
        const fileName = rowData.data.label;
        
        try {
            startDownload({
                type: 'Googledrive', 
                isArchive: false, 
                name: getGoogleDriveEditorName(fileName, rowData.data.type), 
                id: Date.now(), 
                url: `/google/fileDownload/${workspaceId}/${userId}/${fileId}?isPersonal=${isPersonal}`, 
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
        if (!filter || !value) return true;
        try {
            const fileDate = new Date(value);
            const filterDate = new Date(filter);
            return fileDate >= filterDate;
        } catch {
            return false;
        }
    };

    const flagBodyTemplate = (rowData) => {
        if (rowData.data.type === 'Folder') return null;
        rowData.data.workspaceId = workspaceId;
        rowData.data.userId = userId;
        rowData.data.isPersonal = isPersonal;
        return (
          <Flag 
            rowId={rowData.key} 
            type="googledrive" 
            rowData={rowData.data}
            collections={flagCollections}
            initialFlag={flagCollections.find((e) => e._id === storedCollectionMap[rowData.key])}
          />
        );
      };
      
      const nameBodyTemplate = (rowData) => {
        return (
          <Box display="flex" alignItems="center" gap={1}>
            <i className={rowData.icon} style={{ marginRight: '8px' }} />
            <span>{rowData.label}</span>
          </Box>
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
                                // body={nameBodyTemplate}
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
                </>
            )}
        </MainCard>
    );
};

MyFilesTreeTable.propTypes = {
    workspaceId: PropTypes.string.isRequired,
    userId: PropTypes.string.isRequired,
    isPersonal: PropTypes.string.isRequired
};

export default MyFilesTreeTable;