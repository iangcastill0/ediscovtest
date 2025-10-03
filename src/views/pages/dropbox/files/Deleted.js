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

// Function to map Dropbox deleted files into a tree structure
const flattenDriveData = (files) => {
    const items = files.map((file, index) => ({
        key: index,
        label: file.name,
        data: {
            label: file.name,
            path: file.path_display,
        },
        icon: 'pi pi-fw pi-file',
        children: []
    }))
    

    return items;
};

const Deleted = ({ workspaceId, userId, isPersonal }) => {
    const [loading, setLoading] = useState(false);
    const [nodes, setNodes] = useState([]);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [dialogData, setDialogData] = useState('');

    useEffect(() => {
        const fetchDropboxData = async () => {
            setLoading(true);
            try {
                const response = await axiosServices.get(`/dropbox/workspace/${workspaceId}/members/${userId}/files/deleted?isPersonal=${isPersonal}`);
                const treeData = flattenDriveData(response.data.data);
                setNodes(treeData);
            } catch (error) {
                console.error('Error fetching Dropbox Deleted files:', error);
            }
            setLoading(false);
        };

        fetchDropboxData();
    }, [userId]);

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
                <Column field="path" header="Path" filterPlaceholder="Filter by Path"></Column>
                {/* <Column body={actionTemplate} header="Actions"></Column> */}
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

Deleted.propTypes = {
    workspaceId: PropTypes.string.isRequired,
    userId: PropTypes.string.isRequired,
    isPersonal: PropTypes.string.isRequired
};

export default Deleted;
