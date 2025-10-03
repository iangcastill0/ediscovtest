import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useParams } from 'react-router-dom';
import axios from 'utils/axios';

// Material-UI components
import { Box, LinearProgress } from '@mui/material';
import MainCard from 'ui-component/cards/MainCard';

// Custom components
import Labels from './Labels';
import Messages from './Messages';

const GmailView = () => {
    const { workspaceId, userId } = useParams();
    const [labels, setLabels] = useState([]);
    const query = new URLSearchParams(window.location.search);
    const isPersonal = query.get('isPersonal');

    const [selectedLabel, setSelectedLabel] = useState(null);
    const [loading, setLoading] = useState(false);

    // Fetch folder tree data
    useEffect(() => {
        const fetchLabels = async () => {
            setLoading(true);
            try {
                const response = await axios.get(
                    `/google/workspace/${workspaceId}/users/${userId}/gmail/labels?isPersonal=${isPersonal}`
                );
                setLabels(response.data?.labels);
            } catch (error) {
                console.error('Error fetching folders:', error);
            }
            setLoading(false);
        };
        fetchLabels();
    }, [workspaceId, userId]);

    // Event handler for folder selection
    const handleFolderSelect = async (label) => {
        setSelectedLabel(label?.id);
    };

    return (
        <MainCard title="Gmail" backButton sx={{ height: '100%' }}>
            {loading && <LinearProgress />}
            <Box display="flex" flexDirection="row" height="100%">
                {/* Folder Tree */}
                <Box
                    width="20%"
                    height="100%"
                    sx={{
                        overflowY: 'auto', // Allows scrolling if the labels overflow
                        borderRight: '1px solid #ddd', // Optional: adds a visual separator
                    }}
                >
                    <Labels
                        labels={labels}
                        onLabelSelect={handleFolderSelect} // Pass the selection handler
                    />
                </Box>

                {/* Messages Table */}
                <Box width="80%" height="100%">
                    <Messages
                        workspaceId={workspaceId}
                        userId={userId}
                        labelId={selectedLabel} // Pass folder ID to load emails
                        isPersonal={isPersonal}
                    />
                </Box>
            </Box>
        </MainCard>
    );
};

GmailView.propTypes = {
    workspaceId: PropTypes.string,
    userId: PropTypes.string,
};

export default GmailView;
