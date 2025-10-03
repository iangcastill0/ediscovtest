import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { TreeTable } from 'primereact/treetable';
import { Column } from 'primereact/column';
import { LinearProgress } from '@mui/material';
import MainCard from 'ui-component/cards/MainCard';
import "primereact/resources/themes/lara-light-cyan/theme.css";
import './MailFolders.css'

// Helper function to format folder structure
const flattenOutlookData = (folders) => {
    // Flatten and structure folder data into a tree
    const tree = folders.map((folder) => ({
        key: folder.id,
        label: folder.name,
        data: {
            name: folder.name,
            itemCount: folder.totalItemCount,
            id: folder.id
        },
        children: folder.childFolders ? flattenOutlookData(folder.childFolders) : []
    }));
    return tree;
};

const MailFolders = ({ folderInfo, onFolderSelect }) => {
    const [nodes, setNodes] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedNodeKeys, setSelectedNodeKeys] = useState(null);

    useEffect(() => {
        setLoading(true)
        if (folderInfo && folderInfo.length > 0) {
            const treeData = flattenOutlookData(folderInfo);
            setNodes(treeData);
        }
        setLoading(false)
    }, [folderInfo]);

    return (
        <MainCard content={false}>
            {loading && <LinearProgress />}
            <TreeTable
                value={nodes}
                selectionMode="single"
                selectionKeys={selectedNodeKeys} 
                onSelectionChange={(e) => setSelectedNodeKeys(e.value)}
                onSelect={(e) => onFolderSelect(e.node.data)}  // Trigger folder selection
                tableStyle={{ minWidth: '30rem !important', minHeight: '66vh' }}
                >
                <Column field="name" header="Folder Name" expander></Column>
                <Column field="itemCount" header="Count"></Column>
            </TreeTable>
        </MainCard>
    );
};

MailFolders.propTypes = {
    folderInfo: PropTypes.array.isRequired,
    onFolderSelect: PropTypes.func.isRequired
};

export default MailFolders;
