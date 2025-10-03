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
import "primereact/resources/themes/lara-light-cyan/theme.css";
import './Files.css';

// Function to map the response data to TreeTable-compatible structure
const flattenTeamActivityData = (logs) => {
    return logs.map((log, index) => ({
        key: index,
        data: {
            timestamp: log.timestamp,
            actor: log.actor?.admin?.display_name || "Unknown",
            actor_email: log.actor?.admin?.email || "Unknown",
            event: log.event_type?.description || "Unknown Event",
            details: JSON.stringify(log.details || {}, null, 2), // Stringify details for display
            geo_location: `${log.origin?.geo_location?.city || "Unknown"}, ${log.origin?.geo_location?.region || "Unknown"}, ${log.origin?.geo_location?.country || "Unknown"}`,
            ip_address: log.origin?.geo_location?.ip_address || "Unknown",
        },
    }));
};

const ActivityLogs = ({ workspaceId, userId, isPersonal }) => {
    const [loading, setLoading] = useState(false);
    const [nodes, setNodes] = useState([]);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [dialogData, setDialogData] = useState('');

    useEffect(() => {
        const fetchTeamActivityLogs = async () => {
            setLoading(true);
            try {
                const response = await axiosServices.get(`/dropbox/workspace/${workspaceId}/members/${userId}/logs?isPersonal=${isPersonal}`);
                const treeData = flattenTeamActivityData(response.data.data);
                setNodes(treeData);
            } catch (error) {
                console.error('Error fetching Dropbox Team Activity Logs:', error);
            }
            setLoading(false);
        };

        fetchTeamActivityLogs();
    }, [workspaceId, isPersonal]);

    const handleDialogOpen = (details) => {
        setDialogData(details);
        setDialogOpen(true);
    };

    const handleDialogClose = () => {
        setDialogOpen(false);
    };

    const actionTemplate = (rowData) => {
        return (
            <IconButton color="primary" onClick={() => handleDialogOpen(rowData.data.details)}>
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
            <TreeTable value={nodes} tableStyle={{ minWidth: '60rem' }}>
                <Column field="timestamp" header="Timestamp" filter filterPlaceholder="Filter by timestamp"></Column>
                <Column field="actor" header="Actor" filter filterPlaceholder="Filter by actor" body={(rowData) => truncatedBodyTemplate(rowData, 'actor')}></Column>
                <Column field="actor_email" header="Actor Email" filter filterPlaceholder="Filter by email"></Column>
                <Column field="event" header="Event" filter filterPlaceholder="Filter by event"></Column>
                <Column field="geo_location" header="Location" body={(rowData) => truncatedBodyTemplate(rowData, 'geo_location')}></Column>
                <Column field="ip_address" header="IP Address"></Column>
                <Column body={actionTemplate} header="Details"></Column>
            </TreeTable>

            {/* Dialog to display JSON */}
            <Dialog open={dialogOpen} onClose={handleDialogClose} fullWidth maxWidth="sm">
                <DialogTitle>Event Details</DialogTitle>
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

ActivityLogs.propTypes = {
    workspaceId: PropTypes.string.isRequired,
    userId: PropTypes.string.isRequired,
    isPersonal: PropTypes.string.isRequired,
};

export default ActivityLogs;
