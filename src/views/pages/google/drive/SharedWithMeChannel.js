import PropTypes from 'prop-types';
import React, { useState, useEffect } from 'react';
import { TreeTable } from 'primereact/treetable';
import { Column } from 'primereact/column';
import axiosServices from 'utils/axios';
import { ProgressBar } from 'primereact/progressbar';
import MainCard from 'ui-component/cards/MainCard';
import "primereact/resources/themes/lara-light-cyan/theme.css";
import IconButton from '@mui/material/IconButton';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import { Tooltip } from '@mui/material';
import { formatSizeUnits } from 'utils/utils';
import './MyFilesTreeTable.css'; // import your custom CSS

import useDownload from 'hooks/useDownload';

// Function to calculate folder size recursively
const calculateFolderSize = (node) => {
    if (!node.children || node.children.length === 0) {
        return node.data.size !== 'N/A' ? parseInt(node.data.size, 10) : 0;
    }
    return node.children.reduce((total, child) => total + calculateFolderSize(child), 0);
};

// Function to map Google Drive files into a tree structure
const flattenDriveData = (files) => {
    const tree = [];
    const map = {};

    files.forEach(file => {
        const isFolder = file.mimeType === 'application/vnd.google-apps.folder';
        map[file.id] = {
            key: file.id,
            label: file.name,
            data: {
                label: file.name,
                size: file.size || 'N/A',  // raw size for filtering
                formattedSize: file.size ? formatSizeUnits(file.size) : 'N/A',  // formatted size for display
                type: isFolder ? 'Folder' : file.mimeType,
                createdTime: file.createdTime,
                modifiedTime: file.modifiedTime,
                sharedBy: file.owners[0].emailAddress,
                thumbnailLink: file.thumbnailLink || null
            },
            icon: isFolder ? 'pi pi-fw pi-folder' : 'pi pi-fw pi-file',
            children: []
        };
    });

    // Link each item with its parent
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

const SharedWithMeTreeTable = ({ workspaceId, userId, isPersonal }) => {
    const [loading, setLoading] = useState(false);
    const [nodes, setNodes] = useState([]);
    const { startDownload } = useDownload;

    useEffect(() => {
        const fetchGoogleDriveData = async () => {
            setLoading(true);
            try {
                const response = await axiosServices.get(`/google/workspace/${workspaceId}/users/${userId}/v2/sharedDrive?isPersonal=${isPersonal}`);
                
                const treeData = flattenDriveData(response.data);
                // console.log('Shared drive data:', JSON.stringify(response.data, null, 2));
                setNodes(treeData);
            } catch (error) {
                console.error('Error fetching Google Shared With Me Drive data:', error);
            }
            setLoading(false);
        };

        fetchGoogleDriveData();
    }, [userId]);

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
            startDownload({type: 'Googledrive', isArchive: false, name: fileName, id: Date.now(), url: `/google/fileDownload/${workspaceId}/${userId}/${fileId}?isPersonal=${isPersonal}`, size: rowData.data.size, responseType: 'blob'})
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

    // Custom filter function for numeric values (size filtering)
    const sizeFilterFunction = (value, filter) => {
        console.log(value, filter)
        if (!filter || filter.trim() === '') {
            return true; // If no filter is entered, show all rows
        }
        const filterValue = parseFloat(filter);
        return value && parseFloat(value) >= filterValue; // Show rows where size is greater than or equal to the filter
    };

    return (
        <MainCard content={false}>
            {loading && <ProgressBar mode="indeterminate" />}
            <TreeTable value={nodes} tableStyle={{ minWidth: '50rem' }}>
                <Column field="label" header="Name" expander filter filterPlaceholder="Filter by name"></Column>
                <Column
                    field="size"
                    header="Size"
                    filterPlaceholder="Filter by size (min)"
                    filterFunction={sizeFilterFunction} // Use custom filter
                    body={(rowData) => `${rowData.data.formattedSize}`} // Display formatted size
                ></Column>
                <Column field="type" header="Type" filterPlaceholder="Filter by type" body={(rowData) => truncatedBodyTemplate(rowData, 'type')}></Column>
                <Column field="createdTime" header="Created Time" filterPlaceholder="Filter by created time" body={(rowData) => truncatedBodyTemplate(rowData, 'createdTime')}></Column>
                <Column field="modifiedTime" header="Modified Time" filterPlaceholder="Filter by modified time" body={(rowData) => truncatedBodyTemplate(rowData, 'modifiedTime')}></Column>
                <Column field="sharedBy" header="Shared By" body={(rowData) => truncatedBodyTemplate(rowData, 'sharedBy')}></Column>
                <Column body={actionTemplate} header="Actions"></Column>
            </TreeTable>
        </MainCard>
    );
};

SharedWithMeTreeTable.propTypes = {
    workspaceId: PropTypes.string.isRequired,
    userId: PropTypes.string.isRequired,
    isPersonal: PropTypes.string.isRequired
};

export default SharedWithMeTreeTable;
