import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { TreeTable } from 'primereact/treetable';
import { Column } from 'primereact/column';
import axiosServices from 'utils/axios';
import { ProgressBar } from 'primereact/progressbar';
import MainCard from 'ui-component/cards/MainCard';
import IconButton from '@mui/material/IconButton';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import { Tooltip, Dialog, DialogTitle, DialogContent, DialogActions, Button, Table, TableBody, TableCell, TableHead, TableRow } from '@mui/material';
import { formatSizeUnits } from 'utils/utils';
import "primereact/resources/themes/lara-light-cyan/theme.css";
import './Files.css';

import useDownload from 'hooks/useDownload';

const Files = ({ workspaceId, archiveId }) => {
    const [loading, setLoading] = useState(false);
    const [nodes, setNodes] = useState([]);
    const [downloadProgress, setDownloadProgress] = useState({});
    const [versionHistoryData, setVersionHistoryData] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const { startDownload } = useDownload()

    useEffect(() => {
        const fetchDropboxData = async () => {
            setLoading(true);
            try {
                const response = await axiosServices.get(`/archive/dropbox/workspaces/${workspaceId}/archives/${archiveId}`);
                setNodes(response.data?.data.files);
            } catch (error) {
                console.error('Error fetching Dropbox data:', error);
            }
            setLoading(false);
        };

        fetchDropboxData();
    }, [workspaceId, archiveId]);

    const handleDownload = async (rowData) => {
        startDownload({
            type: 'DropboxArchive', 
            isArchive: true, 
            name: `${rowData.label}.zip`, 
            id: Date.now(), 
            url: `/archive/s3/download_v2?s3Key=${rowData.data.s3Key}&filename=${rowData.label}`, 
            size: rowData.data.size, 
            responseType: 'blob'
        })

        // setDownloadProgress((prev) => ({ ...prev, [fileId]: 0 }));

        // try {
        //     const response = await axiosServices.get(`/archive/s3/download?s3Key=${rowData.data.s3Key}&filename=${rowData.label}`, {
        //         responseType: 'blob',
        //         onDownloadProgress: (progressEvent) => {
        //             const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        //             setDownloadProgress((prev) => ({ ...prev, [fileId]: progress }));
        //         }
        //     });

        //     if (response.status === 200) {
        //         const blob = response.data;
        //         const url = window.URL.createObjectURL(blob);
        //         const a = document.createElement('a');
        //         a.href = url;
        //         a.download = fileName;
        //         document.body.appendChild(a);
        //         a.click();
        //         a.remove();
        //         window.URL.revokeObjectURL(url);
        //     }
        // } catch (error) {
        //     console.error('Download failed:', error);
        // } finally {
        //     setDownloadProgress((prev) => ({ ...prev, [fileId]: null }));
        // }
    };

    const handleVersionHistoryClick = (history) => {
        setVersionHistoryData(history);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
    };

    const truncatedBodyTemplate = (rowData, field) => {
        const value = rowData.data[field];
        return (
            <Tooltip title={value || ''} placement="top">
                <span className="truncate">{value || ''}</span>
            </Tooltip>
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

    const actionTemplate = (rowData) => {
        const progress = downloadProgress[rowData.key];

        return progress !== null && progress !== undefined ? (
            <ProgressBar value={progress} />
        ) : (
            <IconButton
                color="primary"
                onClick={() => handleDownload(rowData)}
                sx={{ display: `${rowData.data.type === 'folder' ? 'none' : 'block'}` }}
            >
                <FileDownloadIcon />
            </IconButton>
        );
    };

    return (
        <MainCard content={false}>
            {loading && <ProgressBar mode="indeterminate" />}
            <TreeTable value={nodes} tableStyle={{ minWidth: '50rem' }}>
                <Column
                    field="label"
                    header="Name"
                    expander
                    filter
                    filterPlaceholder="Filter by name"
                    body={(rowData) => truncatedBodyTemplate(rowData, 'label')}
                ></Column>
                <Column
                    field="size"
                    header="Size"
                    filterPlaceholder="Filter by size (min)"
                    body={(rowData) => `${rowData.data.formattedSize}`}
                ></Column>
                <Column
                    field="type"
                    header="Type"
                    filterPlaceholder="Filter by type"
                    body={(rowData) => truncatedBodyTemplate(rowData, 'type')}
                ></Column>
                <Column
                    field="createdTime"
                    header="Created Time"
                    filterPlaceholder="Filter by created time"
                    body={(rowData) => truncatedBodyTemplate(rowData, 'createdTime')}
                ></Column>
                <Column
                    field="modifiedTime"
                    header="Modified Time"
                    filterPlaceholder="Filter by modified time"
                    body={(rowData) => truncatedBodyTemplate(rowData, 'modifiedTime')}
                ></Column>
                <Column
                    field="md5Checksum"
                    header="MD5 Checksum"
                    body={(rowData) => truncatedBodyTemplate(rowData, 'md5Checksum')}
                ></Column>
                <Column
                    field="versionHistory"
                    header="Version History"
                    body={versionHistoryTemplate}
                ></Column>
                <Column body={actionTemplate} header="Actions"></Column>
            </TreeTable>

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
        </MainCard>
    );
};

Files.propTypes = {
    workspaceId: PropTypes.string.isRequired,
    archiveId: PropTypes.string.isRequired
};

export default Files;
