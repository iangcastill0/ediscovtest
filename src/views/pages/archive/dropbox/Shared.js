import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { TreeTable } from 'primereact/treetable';
import { Column } from 'primereact/column';
import axiosServices from 'utils/axios';
import { ProgressBar } from 'primereact/progressbar';
import MainCard from 'ui-component/cards/MainCard';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import VisibilityIcon from '@mui/icons-material/Visibility';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import Button from '@mui/material/Button';
import { formatSizeUnits } from 'utils/utils';
import "primereact/resources/themes/lara-light-cyan/theme.css";
import './Files.css';

// Function to calculate folder size recursively
const calculateFolderSize = (node) => {
    if (!node.children || node.children.length === 0) {
        return node.data.size !== 'N/A' ? parseInt(node.data.size, 10) : 0;
    }
    return node.children.reduce((total, child) => total + calculateFolderSize(child), 0);
};

// Function to map Dropbox shared files into a tree structure
const flattenDriveData = (files) => {
    const tree = [];
    const map = {};

    files.forEach(file => {
        const isFolder = file['.tag'] === 'folder';
        map[file.id] = {
            key: file.id,
            label: file.name,
            data: {
                label: file.name,
                path: file.path_lower,
                url: file.url || null,
                formattedSize: file.size ? formatSizeUnits(file.size) : 'N/A',
                type: isFolder ? 'Folder' : 'File',
                createdTime: file.client_modified || '',
                modifiedTime: file.server_modified || '',
                size: file.size || 'N/A',
                linkPermissions: JSON.stringify(file.link_permissions, null, 2)
            },
            icon: isFolder ? 'pi pi-fw pi-folder' : 'pi pi-fw pi-file',
            children: []
        };
    });

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

    tree.forEach(rootNode => {
        if (rootNode.data.type === 'Folder') {
            rootNode.data.size = calculateFolderSize(rootNode);
            rootNode.data.formattedSize = formatSizeUnits(rootNode.data.size);
        }
    });

    return tree;
};

const Shared = ({ workspaceId, archiveId }) => {
    const [loading, setLoading] = useState(false);
    const [nodes, setNodes] = useState([]);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [dialogData, setDialogData] = useState('');

    useEffect(() => {
        const fetchDropboxData = async () => {
            setLoading(true);
            try {
                const response = await axiosServices.get(`/archive/dropbox/workspaces/${workspaceId}/archives/${archiveId}`);
                const treeData = flattenDriveData(response.data.data.shared);
                setNodes(treeData);
            } catch (error) {
                console.error('Error fetching Dropbox Shared files and folders', error);
            }
            setLoading(false);
        };

        fetchDropboxData();
    }, [workspaceId, archiveId]);

    const handleDialogOpen = (linkPermissions) => {
        setDialogData(linkPermissions);
        setDialogOpen(true);
    };

    const handleDialogClose = () => {
        setDialogOpen(false);
    };

    const actionTemplate = (rowData) => {
        return (
            <IconButton color="primary" onClick={() => handleDialogOpen(rowData.data.linkPermissions)}>
                <VisibilityIcon />
            </IconButton>
        );
    };

    const truncatedBodyTemplate = (rowData, field) => {
        return (
            <Tooltip title={rowData.data[field]} placement="top">
                <span className="truncate">{rowData.data[field]}</span>
            </Tooltip>
        );
    };

    return (
        <MainCard content={false}>
            {loading && <ProgressBar mode="indeterminate" />}
            <TreeTable value={nodes} tableStyle={{ minWidth: '50rem' }}>
                <Column field="label" header="Name" expander filter filterPlaceholder="Filter by name"></Column>
                <Column field="url" header="Url" filterPlaceholder="Filter by Url" body={(rowData) => truncatedBodyTemplate(rowData, 'url')}></Column>
                <Column field="path" header="Path Lower" filterPlaceholder="Filter by Path" body={(rowData) => truncatedBodyTemplate(rowData, 'path')}></Column>
                <Column field="type" header="Type" body={(rowData) => truncatedBodyTemplate(rowData, 'type')}></Column>
                <Column field="size" header="Size" filterPlaceholder="Filter by size (min)" body={(rowData) => `${rowData.data.formattedSize}`}></Column>
                <Column field="createdTime" header="Created Time" filterPlaceholder="Filter by created time" body={(rowData) => truncatedBodyTemplate(rowData, 'createdTime')}></Column>
                <Column field="modifiedTime" header="Modified Time" filterPlaceholder="Filter by modified time" body={(rowData) => truncatedBodyTemplate(rowData, 'modifiedTime')}></Column>
                <Column body={actionTemplate} header="Actions"></Column>
            </TreeTable>

            {/* Dialog to display JSON */}
            <Dialog open={dialogOpen} onClose={handleDialogClose} fullWidth maxWidth="sm">
                <DialogTitle>Link Permissions</DialogTitle>
                <DialogContent>
                    <pre>{dialogData}</pre>
                </DialogContent>
                <Button onClick={handleDialogClose} color="primary">
                    Close
                </Button>
            </Dialog>
        </MainCard>
    );
};

Shared.propTypes = {
    workspaceId: PropTypes.string.isRequired,
    archiveId: PropTypes.string.isRequired
};

export default Shared;
