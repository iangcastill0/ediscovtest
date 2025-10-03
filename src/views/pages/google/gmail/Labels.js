import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { TreeTable } from 'primereact/treetable';
import { Column } from 'primereact/column';
import { LinearProgress } from '@mui/material';
import MainCard from 'ui-component/cards/MainCard';
import "primereact/resources/themes/lara-light-cyan/theme.css";
import './Labels.css';

const formatLabel = label => {
    if (!label) return '';
    return label.charAt(0).toUpperCase() + label.slice(1).toLowerCase();
};
// Helper function to build tree structure
const buildTreeFromLabels = (labels) => {
    const root = [];
    const labelMap = {};

    labels.forEach(label => {
        // Ignore hidden labels
        if (label.messageListVisibility === 'hide' || label.labelListVisibility === 'labelHide') return;

        const parts = label.name.split('/');
        parts.reduce((parent, part, index) => {
            const currentPath = parts.slice(0, index + 1).join('/');
            if (!labelMap[currentPath]) {
                const newNode = {
                    key: currentPath,
                    label: formatLabel(part),
                    data: { 
                        name: formatLabel(part), 
                        type: label.type, // Include the type field
                        id: label.id 
                    },
                    children: []
                };
                labelMap[currentPath] = newNode;
                if (index === 0) {
                    root.push(newNode);
                } else {
                    parent.children.push(newNode);
                }
            }
            return labelMap[currentPath];
        }, { children: root });
    });

    return root;
};

const MailFolders = ({ labels, onLabelSelect }) => {
    const [nodes, setNodes] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedNodeKeys, setSelectedNodeKeys] = useState(null);

    useEffect(() => {
        setLoading(true);
        if (labels && labels.length > 0) {
            const treeData = buildTreeFromLabels(labels);
            treeData.push({
                key: 'trash',
                label: 'Trash',
                data: { 
                    name: 'Trash', 
                    type: 'system', // Include the type field
                    id: 'trash' 
                },
                children: []
            })
            setNodes(treeData);
        }
        setLoading(false);
    }, [labels]);

    return (
        <MainCard content={false}>
            {loading && <LinearProgress />}
            <TreeTable
                value={nodes}
                selectionMode="single"
                selectionKeys={selectedNodeKeys}
                onSelectionChange={(e) => setSelectedNodeKeys(e.value)}
                onSelect={(e) => onLabelSelect(e.node.data)}  // Trigger label selection
                tableStyle={{ minWidth: '30rem !important', minHeight: '66vh' }}
            >
                <Column field="name" header="Label Name" expander></Column>
                <Column field="type" header="Type"></Column>
            </TreeTable>
        </MainCard>
    );
};

MailFolders.propTypes = {
    labels: PropTypes.array.isRequired,
    onLabelSelect: PropTypes.func.isRequired
};

export default MailFolders;
