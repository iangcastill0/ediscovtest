import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useParams } from 'react-router-dom';
import axios from 'utils/axios';

// Material-UI components
import { Box, LinearProgress } from '@mui/material';
import MainCard from 'ui-component/cards/MainCard';

// Custom components
import MailFolders from './MailFolders';
import MesssageTable from './MessageTable';
import { height } from '@mui/system';

const OutlookView = () => {
    const { workspaceId, userId } = useParams();
    const [selectedFolder, setSelectedFolder] = useState(null);
    const [folderInfo, setFolderInfo] = useState([]);
    const [loading, setLoading] = useState(false);

    // Fetch folder tree data
    useEffect(() => {
        const fetchFolderInfo = async () => {
            setLoading(true);
            try {
                const response = await axios.get(`/ms365/workspace/${workspaceId}/users/${userId}/outlook/folders`);
                setFolderInfo(response.data.mailFolders);
            } catch (error) {
                console.error('Error fetching folders:', error);
            }
            setLoading(false);
        };
        fetchFolderInfo();
    }, [workspaceId, userId]);

    // Event handler for folder selection
    const handleFolderSelect = async (folder) => {
        console.log("Selected Folder: ", folder)
        setSelectedFolder(folder);
    };

    return (
        <MainCard title="Outlook" backButton sx={{height: '100%'}}>
            {loading && <LinearProgress />}
            <Box display="flex" flexDirection="row" height='100%'>
                {/* Folder Tree */}
                <Box width="20%" height="100%">
                    <MailFolders
                        folderInfo={folderInfo}
                        onFolderSelect={handleFolderSelect}  // Pass the selection handler
                    />
                </Box>

                {/* Messages Table */}
                <Box width="80%">
                    <MesssageTable
                        workspaceId={workspaceId}
                        userId={userId}
                        folder={selectedFolder} // Pass folder ID to load emails
                    />
                </Box>
            </Box>
        </MainCard>
    );
};

OutlookView.propTypes = {
    workspaceId: PropTypes.string,
    userId: PropTypes.string
};

export default OutlookView;
