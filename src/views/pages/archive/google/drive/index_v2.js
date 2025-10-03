import React, { useState, useEffect } from 'react';
import {
    Button,
    Dialog,
    DialogContent,
    DialogTitle,
    TextField,
    Box,
    LinearProgress,
    CircularProgress,
    DialogActions,
    Tooltip
} from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import { TreeTable } from 'primereact/treetable';
import { Column } from 'primereact/column';
import axios from 'axios';
import axiosServices from 'utils/axios';
import { ProgressBar } from 'primereact/progressbar';
import MainCard from 'ui-component/cards/MainCard';
import "primereact/resources/themes/lara-light-cyan/theme.css";
import IconButton from '@mui/material/IconButton';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import { formatSizeUnits } from 'utils/utils';
import { getDriveArchive, exportToFolderZipMultiple } from 'utils/apiHelper';
import './MyFilesTreeTable.css'; // import your custom CSS
import useDownload from 'hooks/useDownload';
import SimpleSearchDialog from 'ui-component/extended/SimpleSearchDialog';

const calculateFolderSize = (node) => {
    if (node.data.type !== 'Folder') {
        return parseInt(node.data.size, 10) || 0;
    }

    return node.children.reduce((totalSize, child) => {
        const childSize = calculateFolderSize(child);
        return totalSize + childSize;
    }, 0);
};

const updateFolderSizes = (tree) => {
    tree.forEach(node => {
        if (node.data.type === 'Folder') {
            const folderSize = calculateFolderSize(node);
            node.data.size = folderSize;
            node.data.formattedSize = formatSizeUnits(folderSize);
        } else {
            node.data.formattedSize = formatSizeUnits(node.data.size);
        }

        if (node.children && node.children.length > 0) {
            updateFolderSizes(node.children);
        }
    });

    return tree;
};

const MyFilesTreeTable = ({ userId }) => {
    const [loading, setLoading] = useState(false);
    const [nodes, setNodes] = useState([]);
    const { backupId } = useParams();
    const { startDownload } = useDownload()
    const [dialogOpen, setDialogOpen] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchGoogleDriveData = async () => {
            setLoading(true);
            try {
                const data = await getDriveArchive(backupId);
                const treeData = updateFolderSizes(data?.backups);
                setNodes(treeData);
            } catch (error) {
                console.error('Error fetching Google Drive data:', error);
            }
            setLoading(false);
        };

        fetchGoogleDriveData();
    }, [userId]);

    const handleDownload = async (rowData) => {
        const fileId = rowData.key;
        const fileName = rowData.data.label;

        try {
            // const options = {
            //     responseType: 'blob',
            //     onDownloadProgress: (progressEvent) => {
            //         const progress = Math.round((progressEvent.loaded * 100) / rowData.data.size);
            //         setNodes((prevNodes) => updateNodeProgress(prevNodes, fileId, progress));
            //     }
            // };

            // const response = await axiosServices.post(`/archive/${backupId}/googledrive/download/`, { s3Key: rowData.data.s3Key }, options);

            // if (response.status === 200) {
            //     const blob = response.data;
            //     const url = window.URL.createObjectURL(blob);
            //     const a = document.createElement('a');
            //     a.href = url;
            //     a.download = fileName;
            //     document.body.appendChild(a);
            //     a.click();
            //     a.remove();
            //     window.URL.revokeObjectURL(url);
            // }
            startDownload({
                type: 'GoogledriveArchive',
                isArchive: true,
                name: `${rowData.label}.zip`,
                id: Date.now(),
                url: `/archive/s3/download_v2?s3Key=${rowData.data.s3Key}&filename=${rowData.label}`,
                size: parseInt(rowData.data.size, 10),
                responseType: 'blob'
            });
    
        } catch (error) {
            console.error('Download failed:', error);
        }
    };

    const actionTemplate = (rowData) => (
        <IconButton
            color="primary"
            onClick={() => handleDownload(rowData)}
            sx={{ display: `${rowData.data.type === 'Folder' ? 'none' : 'block'}` }}
        >
            <FileDownloadIcon />
        </IconButton>
    );

    

    const updateNodeProgress = (nodes, fileId, progress) => {
        console.log("progress: ", progress)
        return nodes.map((node) => {
            if (node.key === fileId) {
                return { ...node, data: { ...node.data, progress } };
            }

            if (node.children) {
                return { ...node, children: updateNodeProgress(node.children, fileId, progress) };
            }

            return node;
        });
    };

    const progressBodyTemplate = (rowData) => {
        const progress = rowData.data.progress || 0;
        return (
            rowData.data.type === 'Folder' ? null : <ProgressBar value={progress} />
        );
    };

    const truncatedBodyTemplate = (rowData, field) => (
        <Tooltip title={rowData.data[field]} placement="top">
            <span className="truncate">{rowData.data[field]}</span>
        </Tooltip>
    );

    const sizeFilterFunction = (value, filter) => {
        if (!filter || filter.trim() === '') {
            return true;
        }
        const filterValue = parseFloat(filter);
        return value && parseFloat(value) >= filterValue;
    };

    const handleAdvancedSearchSubmit = (data) => {
        console.log('GoogleDrive Advanced Search Data:', data);
        let parameterText = `q=${data.keywords}`;
        if (data.dateRange.start) {
            parameterText += `&start=${data.dateRange.start.toLocaleDateString('en-CA')}`;
        }
        if (data.dateRange.end) {
            parameterText += `&end=${data.dateRange.end.toLocaleDateString('en-CA')}`;
        }
        if (data.emailFilters.from !== '') {
            parameterText += `&from=${data.emailFilters.from}`;
        }
        if (data.emailFilters.to !== '') {
            parameterText += `&to=${data.emailFilters.to}`;
        }
        parameterText += `&archives=${backupId}`;
        parameterText += `&type=googledrive`;
        navigate(`/search?${parameterText}`, { replace: true, state: { forceRefresh: true } });
    };

    return (
        <MainCard title={backupId} content={false} backButton>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Button
                    variant="contained"
                    onClick={() => setDialogOpen(true)}
                    style={{ margin: 8, float: 'right' }}
                >
                    {'Advanced\nSearch'}
                </Button>
            </Box>
            {loading && <ProgressBar mode="indeterminate" />}
            <TreeTable value={nodes} tableStyle={{ minWidth: '50rem' }}>
                <Column field="label" header="Name" expander filter filterPlaceholder="Filter by name"></Column>
                <Column
                    field="size"
                    header="Size"
                    filterPlaceholder="Filter by size (min)"
                    filterFunction={sizeFilterFunction}
                    body={(rowData) => `${rowData.data.formattedSize}`}
                ></Column>
                <Column field="type" header="Type" filterPlaceholder="Filter by type" body={(rowData) => truncatedBodyTemplate(rowData, 'type')}></Column>
                <Column field="createdTime" header="Created Time" filterPlaceholder="Filter by created time" body={(rowData) => truncatedBodyTemplate(rowData, 'createdTime')}></Column>
                <Column field="modifiedTime" header="Modified Time" filterPlaceholder="Filter by modified time" body={(rowData) => truncatedBodyTemplate(rowData, 'modifiedTime')}></Column>
                <Column field="md5Checksum" header="MD5 Checksum" body={(rowData) => truncatedBodyTemplate(rowData, 'md5Checksum')}></Column>
                {/* <Column field="progress" header="Progress" body={progressBodyTemplate}></Column> */}
                <Column body={actionTemplate} header="Actions"></Column>
            </TreeTable>
            <SimpleSearchDialog
                open={dialogOpen}
                onClose={() => setDialogOpen(false)}
                onSubmit={handleAdvancedSearchSubmit}
            />
        </MainCard>
    );
};

export default MyFilesTreeTable;
